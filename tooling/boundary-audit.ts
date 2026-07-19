import { readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";

import { Console, Data, Effect, pipe } from "effect";
import ts from "typescript";

import { boundaryExceptions } from "./boundary-exceptions.js";
import type { BoundaryException, BoundaryRule } from "./boundary-exceptions.js";

export type BoundaryDiagnostic = Readonly<{
  file: string;
  line: number;
  rule: BoundaryRule;
  symbol: string;
  occurrence: string;
  message: string;
}>;

type AuditOptions = Readonly<{
  cwd: string;
  files?: readonly string[];
  exceptions?: readonly BoundaryException[];
}>;

const productionFile = (file: string) =>
  /\.(?:[cm]?ts|tsx)$/.test(file) &&
  !file.includes(`${sep}test${sep}`) &&
  !file.endsWith(".test.ts") &&
  !file.includes(`${sep}node_modules${sep}`) &&
  !file.includes(`${sep}dist${sep}`);

const sourceFiles = (directory: string): readonly string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return productionFile(path) ? [path] : [];
  });

const rootSourceFiles = (cwd: string) =>
  ["apps", "packages"]
    .flatMap((directory) => sourceFiles(resolve(cwd, directory)))
    .filter(
      (file) =>
        !file.includes(`${sep}.eve${sep}`) &&
        !file.includes(`${sep}.local${sep}`)
    );

const nodeSymbol = (node: ts.Node) => {
  let current: ts.Node | undefined = node;
  while (current !== undefined) {
    if (ts.isFunctionDeclaration(current) && current.name !== undefined) {
      return current.name.text;
    }
    if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    if (ts.isMethodDeclaration(current) && ts.isIdentifier(current.name)) {
      return current.name.text;
    }
    if (ts.isClassDeclaration(current) && current.name !== undefined) {
      return current.name.text;
    }
    if (
      ts.isInterfaceDeclaration(current) ||
      ts.isTypeAliasDeclaration(current)
    ) {
      return current.name.text;
    }
    current = current.parent;
  }
  return "<module>";
};

const hasExportModifier = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  ts
    .getModifiers(node)
    ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ===
    true;

const isPublicSignatureType = (node: ts.TypeNode) => {
  let current: ts.Node | undefined = node;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isMethodDeclaration(current) ||
      ts.isClassDeclaration(current) ||
      ts.isInterfaceDeclaration(current) ||
      ts.isTypeAliasDeclaration(current) ||
      ts.isVariableStatement(current)
    ) {
      return hasExportModifier(current) || hasExportModifier(current.parent);
    }
    current = current.parent;
  }
  return false;
};

const isWithinPublicDeclaration = (node: ts.Node) => {
  let current: ts.Node | undefined = node;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (
      ts.isFunctionDeclaration(current) ||
      ts.isClassDeclaration(current) ||
      ts.isVariableStatement(current)
    ) {
      return hasExportModifier(current) || hasExportModifier(current.parent);
    }
    current = current.parent;
  }
  return false;
};

const dottedName = (expression: ts.Expression): string | undefined => {
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isPropertyAccessExpression(expression)) {
    const left = dottedName(expression.expression);
    return left === undefined ? undefined : `${left}.${expression.name.text}`;
  }
  return undefined;
};

const exactException = (
  exception: BoundaryException,
  file: string,
  symbol: string,
  occurrence: string,
  rule: BoundaryRule
) =>
  exception.file === file &&
  exception.symbol === symbol &&
  exception.occurrence === occurrence &&
  exception.rule === rule;

const occurrence = (node: ts.Node) => {
  if (ts.isCallExpression(node)) {
    const name = dottedName(node.expression) ?? "call";
    const [firstArgument] = node.arguments;
    return firstArgument !== undefined && ts.isStringLiteral(firstArgument)
      ? `${name}:${firstArgument.text}`
      : name;
  }
  if (ts.isPropertySignature(node) && node.name !== undefined) {
    return `property:${node.name.getText()}`;
  }
  if (ts.isParameter(node) && ts.isIdentifier(node.name)) {
    return `parameter:${node.name.text}`;
  }
  return `${ts.SyntaxKind[node.kind]}:${node.getText().replaceAll(/\s+/g, " ")}`;
};

const isSchemaSideType = (
  checker: ts.TypeChecker,
  node: ts.TypeNode,
  visited = new Set<ts.Symbol>()
): boolean => {
  if (
    ts.isTypeQueryNode(node) &&
    ts.isQualifiedName(node.exprName) &&
    ["Type", "Encoded"].includes(node.exprName.right.text)
  ) {
    return true;
  }
  if (!ts.isTypeReferenceNode(node)) {
    return false;
  }
  const symbol = checker.getSymbolAtLocation(node.typeName);
  if (symbol === undefined) {
    return false;
  }
  const target =
    symbol.flags === ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  if (visited.has(target)) {
    return false;
  }
  visited.add(target);
  return (
    target.declarations?.some(
      (declaration) =>
        ts.isTypeAliasDeclaration(declaration) &&
        isSchemaSideType(checker, declaration.type, visited)
    ) === true
  );
};

const isRawBoundaryType = (checker: ts.TypeChecker, node: ts.TypeNode) => {
  if (
    node.kind === ts.SyntaxKind.StringKeyword ||
    node.kind === ts.SyntaxKind.UnknownKeyword ||
    node.kind === ts.SyntaxKind.AnyKeyword
  ) {
    return true;
  }
  if (!ts.isTypeReferenceNode(node)) {
    return false;
  }
  if (isSchemaSideType(checker, node)) {
    return false;
  }
  if (checker.getSymbolAtLocation(node.typeName) === undefined) {
    return false;
  }
  const type = checker.getTypeFromTypeNode(node);
  return [ts.TypeFlags.String, ts.TypeFlags.Unknown, ts.TypeFlags.Any].includes(
    type.flags
  );
};

const isExportedSchema = (node: ts.CallExpression) => {
  let current: ts.Node | undefined = node;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (ts.isVariableStatement(current)) {
      return hasExportModifier(current);
    }
    current = current.parent;
  }
  return false;
};

const isInlineStringSchema = (node: ts.Expression) => {
  const name = dottedName(ts.isCallExpression(node) ? node.expression : node);
  return name === "Schema.String" || name === "Schema.NonEmptyString";
};

const rootCallName = (node: ts.CallExpression) => {
  let { expression } = node;
  while (ts.isCallExpression(expression)) {
    ({ expression } = expression);
  }
  return dottedName(expression);
};

const codecSide = (
  checker: ts.TypeChecker,
  codec: ts.Expression,
  side: "Type" | "Encoded"
) => {
  const codecType = checker.getTypeAtLocation(codec);
  const property = checker.getPropertyOfType(codecType, side);
  return property === undefined ? undefined : checker.getTypeOfSymbol(property);
};

const codecMisuse = (
  checker: ts.TypeChecker,
  node: ts.CallExpression
): "Type" | "Encoded" | null => {
  if (!ts.isCallExpression(node.expression) || node.arguments.length !== 1) {
    return null;
  }
  const factoryName = dottedName(node.expression.expression);
  if (
    factoryName !== "Schema.decodeUnknownEffect" &&
    factoryName !== "Schema.encodeUnknownEffect"
  ) {
    return null;
  }
  const [codec] = node.expression.arguments;
  const [input] = node.arguments;
  if (codec === undefined || input === undefined) {
    return null;
  }
  const expectedSide =
    factoryName === "Schema.decodeUnknownEffect" ? "Encoded" : "Type";
  const expected = codecSide(checker, codec, expectedSide);
  if (expected === undefined) {
    return null;
  }
  const inputType = checker.getTypeAtLocation(input);
  const inputAnnotation = ts.isIdentifier(input)
    ? checker
        .getSymbolAtLocation(input)
        ?.declarations?.find(ts.isVariableDeclaration)?.type
    : undefined;
  const annotationSide =
    inputAnnotation !== undefined && ts.isIndexedAccessTypeNode(inputAnnotation)
      ? inputAnnotation.indexType.getText().replaceAll(/["']/g, "")
      : null;
  return annotationSide === expectedSide &&
    checker.isTypeAssignableTo(inputType, expected)
    ? expectedSide
    : null;
};

const isEncodedExpression = (
  checker: ts.TypeChecker,
  node: ts.Expression,
  seen: ReadonlySet<ts.Symbol> = new Set()
): boolean => {
  if (ts.isParenthesizedExpression(node)) {
    return isEncodedExpression(checker, node.expression, seen);
  }
  if (ts.isYieldExpression(node) && node.expression !== undefined) {
    if (!ts.isCallExpression(node.expression)) {
      return false;
    }
    if (rootCallName(node.expression) === "Schema.encodeEffect") {
      return true;
    }
    return (
      ts.isPropertyAccessExpression(node.expression.expression) &&
      node.expression.expression.name.text === "pipe" &&
      ts.isCallExpression(node.expression.expression.expression) &&
      rootCallName(node.expression.expression.expression) ===
        "Schema.encodeEffect"
    );
  }
  if (!ts.isIdentifier(node)) {
    return false;
  }
  const symbol = checker.getSymbolAtLocation(node);
  if (symbol === undefined || seen.has(symbol)) {
    return false;
  }
  const declaration = symbol.declarations?.find(ts.isVariableDeclaration);
  return (
    declaration?.initializer !== undefined &&
    isEncodedExpression(
      checker,
      declaration.initializer,
      new Set([...seen, symbol])
    )
  );
};

const isPlainStringType = (type: ts.Type): boolean => {
  if (type.isUnion()) {
    return type.types.every(isPlainStringType);
  }
  return type.flags === ts.TypeFlags.String || type.isStringLiteral();
};

const rawOutboundArgument = (
  checker: ts.TypeChecker,
  node: ts.CallExpression
) => {
  const name = dottedName(node.expression);
  if (name !== "HttpClientRequest.bodyText" && name !== "KeyValueStore.set") {
    return null;
  }
  const value =
    name === "HttpClientRequest.bodyText"
      ? node.arguments[0]
      : node.arguments.at(-1);
  if (
    value === undefined ||
    isEncodedExpression(checker, value) ||
    !isPlainStringType(checker.getTypeAtLocation(value))
  ) {
    return null;
  }
  return value;
};

const isRawResponseRead = (
  checker: ts.TypeChecker,
  node: ts.CallExpression
) => {
  if (!ts.isPropertyAccessExpression(node.expression)) {
    return false;
  }
  const method = node.expression.name.text;
  const resultType = checker.getTypeAtLocation(node);
  const awaitedType = checker.getAwaitedType(resultType);
  return (
    (method === "text" || method === "json") &&
    awaitedType !== undefined &&
    awaitedType !== resultType
  );
};

const namedCallRules: readonly Readonly<{
  names: readonly string[];
  rule: BoundaryRule;
  message: string;
}>[] = [
  {
    names: ["JSON.parse", "JSON.stringify"],
    rule: "direct-json",
    message: "Direct JSON APIs bypass the canonical Schema codec.",
  },
  {
    names: [
      "Schema.decodeSync",
      "Schema.decodeUnknownSync",
      "Schema.encodeSync",
      "Schema.encodeUnknownSync",
    ],
    rule: "sync-schema-codec",
    message:
      "Production and operator boundaries must use Effectful Schema codecs.",
  },
  {
    names: ["Config.string", "Config.nonEmptyString", "Config.redacted"],
    rule: "config-primitive",
    message:
      "Semantic configuration must use Config.schema with its owner-named Schema.",
  },
  {
    names: ["fetch"],
    rule: "raw-fetch",
    message:
      "Provider fetch must be confined to a named adapter using Effect HttpClient.",
  },
];

type ReportDiagnostic = (
  node: ts.Node,
  rule: BoundaryRule,
  message: string
) => void;

const inspectInlineSchema = (
  node: ts.CallExpression,
  report: ReportDiagnostic
) => {
  const schemaConstructor = rootCallName(node);
  if (
    !(isExportedSchema(node) || isWithinPublicDeclaration(node)) ||
    (schemaConstructor !== "Schema.Struct" &&
      schemaConstructor !== "Schema.TaggedStruct" &&
      schemaConstructor !== "Schema.TaggedErrorClass")
  ) {
    return;
  }
  const fields = node.arguments.at(-1);
  if (fields === undefined || !ts.isObjectLiteralExpression(fields)) {
    return;
  }
  for (const property of fields.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      isInlineStringSchema(property.initializer)
    ) {
      report(
        property,
        "inline-string-schema",
        "Exported Schema structures must use owner-named field Schemas instead of inline string fields."
      );
    }
  }
};

const inspectCallExpression = (
  checker: ts.TypeChecker,
  node: ts.CallExpression,
  report: ReportDiagnostic
) => {
  const name = dottedName(node.expression);
  for (const rule of namedCallRules) {
    if (name !== undefined && rule.names.includes(name)) {
      report(node, rule.rule, rule.message);
    }
  }
  if (isRawResponseRead(checker, node)) {
    report(
      node,
      "raw-response-text",
      "Raw response text or JSON must be decoded by the canonical boundary codec before domain use."
    );
  }
  const codecSideName = codecMisuse(checker, node);
  if (codecSideName !== null) {
    report(
      node,
      "codec-provenance",
      `Schema.${codecSideName === "Encoded" ? "decodeUnknownEffect" : "encodeUnknownEffect"} received the codec's known ${codecSideName} representation. Use the typed codec operation instead.`
    );
  }
  const outboundValue = rawOutboundArgument(checker, node);
  if (outboundValue !== null) {
    report(
      outboundValue,
      "raw-outbound-write",
      "Outbound HTTP or persistence values must come from Schema.encodeEffect or a framework Schema body API."
    );
  }
  inspectInlineSchema(node, report);
};

/** Runs the narrow provenance audit without loading application runtime code. */
export const auditBoundaryProvenance = (
  options: AuditOptions
): readonly BoundaryDiagnostic[] => {
  const files = options.files ?? rootSourceFiles(options.cwd);
  const program = ts.createProgram({
    rootNames: [...files],
    options: {
      customConditions: ["@bundjil/source"],
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      noEmit: true,
      strict: true,
      target: ts.ScriptTarget.ESNext,
    },
  });
  const checker = program.getTypeChecker();
  const exceptions =
    options.exceptions ??
    (options.files === undefined ? boundaryExceptions : []);
  const diagnostics: BoundaryDiagnostic[] = [];
  const usedExceptions = new Set<BoundaryException>();
  const occurrenceCounts = new Map<string, number>();

  const report = (node: ts.Node, rule: BoundaryRule, message: string) => {
    const sourceFile = node.getSourceFile();
    const file = relative(options.cwd, sourceFile.fileName);
    const symbol = nodeSymbol(node);
    const baseOccurrence = occurrence(node);
    const occurrenceKey = `${file}\u0000${symbol}\u0000${rule}\u0000${baseOccurrence}`;
    const occurrenceIndex = (occurrenceCounts.get(occurrenceKey) ?? 0) + 1;
    occurrenceCounts.set(occurrenceKey, occurrenceIndex);
    const nodeOccurrence = `${baseOccurrence}#${occurrenceIndex}`;
    const exception = exceptions.find((entry) =>
      exactException(entry, file, symbol, nodeOccurrence, rule)
    );
    if (exception !== undefined) {
      usedExceptions.add(exception);
      return;
    }
    const line =
      sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line +
      1;
    diagnostics.push({
      file,
      line,
      rule,
      symbol,
      occurrence: nodeOccurrence,
      message: `${message} Define or reuse an owner-named Schema contract, then decode at the inbound adapter or encode at the outbound adapter.`,
    });
  };

  for (const sourceFile of program.getSourceFiles()) {
    if (!files.includes(sourceFile.fileName)) {
      continue;
    }
    const visit = (node: ts.Node): void => {
      if (
        ts.isTypeNode(node) &&
        isPublicSignatureType(node) &&
        isRawBoundaryType(checker, node)
      ) {
        // Resolving the type ensures aliases and imports are inspected by the checker.
        checker.getTypeFromTypeNode(node);
        report(
          node,
          "boundary-raw-primitive",
          "Public boundary signatures cannot expose raw string, unknown, any, Record<string, ...>, or Map<string, ...>."
        );
      }
      if (ts.isCallExpression(node)) {
        inspectCallExpression(checker, node, report);
      }
      if (
        (ts.isAsExpression(node) ||
          ts.isTypeAssertionExpression(node) ||
          ts.isNonNullExpression(node)) &&
        isWithinPublicDeclaration(node)
      ) {
        report(
          node,
          "unsafe-boundary-syntax",
          "Unsafe assertions and non-null assertions are not admitted at a boundary."
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }

  for (const exception of exceptions) {
    if (!usedExceptions.has(exception)) {
      diagnostics.push({
        file: exception.file,
        line: 1,
        rule: exception.rule,
        symbol: exception.symbol,
        occurrence: exception.occurrence,
        message: `Stale exception for ${exception.symbol}. Remove it or restore the exact third-party/framework boundary it documents.`,
      });
    }
  }
  return diagnostics.toSorted(
    (left, right) =>
      left.file.localeCompare(right.file) || left.line - right.line
  );
};

class BoundaryAuditError extends Data.TaggedError("BoundaryAuditError")<{
  readonly message: string;
  readonly diagnostics?: readonly BoundaryDiagnostic[];
}> {}

const renderDiagnostic = (diagnostic: BoundaryDiagnostic) =>
  `${diagnostic.file}:${diagnostic.line} [${diagnostic.rule}] ${diagnostic.symbol} (${diagnostic.occurrence}): ${diagnostic.message}`;

const handleBoundaryAuditError = (error: BoundaryAuditError) => {
  const output =
    error.diagnostics === undefined
      ? Console.error(error.message)
      : pipe(
          error.diagnostics,
          Effect.forEach((diagnostic) =>
            Console.error(renderDiagnostic(diagnostic))
          )
        );
  return output.pipe(
    Effect.andThen(
      Effect.sync(() => {
        process.exitCode = 1;
      })
    )
  );
};

const runBoundaryAudit = Effect.fn("BoundaryAudit.run")(
  function* () {
    const diagnostics = yield* Effect.try({
      try: () => auditBoundaryProvenance({ cwd: process.cwd() }),
      catch: () =>
        new BoundaryAuditError({
          message:
            "The boundary provenance audit could not inspect the repository.",
        }),
    });
    if (diagnostics.length > 0) {
      return yield* new BoundaryAuditError({
        message: "Boundary provenance violations found.",
        diagnostics,
      });
    }
    return yield* Effect.void;
  },
  (effect) =>
    effect.pipe(Effect.catchTag("BoundaryAuditError", handleBoundaryAuditError))
);

if (import.meta.main) {
  await Effect.runPromise(runBoundaryAudit());
}
