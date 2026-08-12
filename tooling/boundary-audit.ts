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

const entityRootName = (name: ts.EntityName): string =>
  ts.isIdentifier(name) ? name.text : entityRootName(name.left);

const isEffectHttpTransportType = (node: ts.TypeNode) => {
  if (
    !ts.isTypeReferenceNode(node) ||
    !["HttpClientRequest", "HttpClientResponse"].includes(
      node.typeName.getText().split(".").at(-1) ?? ""
    )
  ) {
    return false;
  }
  const rootName = entityRootName(node.typeName);

  return node.getSourceFile().statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== "effect/unstable/http"
    ) {
      return false;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings === undefined) {
      return false;
    }
    if (ts.isNamespaceImport(bindings)) {
      return bindings.name.text === rootName;
    }
    return bindings.elements.some((element) => element.name.text === rootName);
  });
};

const isPublicGenericFetchProperty = (node: ts.PropertySignature) =>
  node.type !== undefined &&
  node.name.getText() === "fetch" &&
  isPublicSignatureType(node.type);

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

const isRawCauseSchema = (node: ts.Expression): boolean => {
  if (ts.isCallExpression(node)) {
    const name = dottedName(node.expression);
    if (name === "Schema.Defect") {
      return true;
    }
    if (name === "Schema.optional") {
      const [inner] = node.arguments;
      return inner !== undefined && isRawCauseSchema(inner);
    }
  }
  return false;
};

const rootCallName = (node: ts.CallExpression) => {
  let { expression } = node;
  while (ts.isCallExpression(expression)) {
    ({ expression } = expression);
  }
  return dottedName(expression);
};

const isDataTaggedErrorClass = (node: ts.ClassDeclaration) =>
  node.heritageClauses?.some((clause) =>
    clause.types.some(
      (type) =>
        ts.isCallExpression(type.expression) &&
        rootCallName(type.expression) === "Data.TaggedError"
    )
  ) === true;

const isOperatorRawCause = (node: ts.PropertySignature) => {
  if (
    node.type?.kind !== ts.SyntaxKind.UnknownKeyword ||
    !node.getSourceFile().fileName.includes(`${sep}scripts${sep}`)
  ) {
    return false;
  }
  let current: ts.Node | undefined = node.parent;
  while (current !== undefined && !ts.isSourceFile(current)) {
    if (ts.isClassDeclaration(current)) {
      return isDataTaggedErrorClass(current);
    }
    current = current.parent;
  }
  return false;
};

const inspectClassDeclaration = (
  node: ts.ClassDeclaration,
  report: ReportDiagnostic
) => {
  if (!hasExportModifier(node) || !isDataTaggedErrorClass(node)) {
    return;
  }
  report(
    node,
    "public-data-tagged-error",
    "Exported typed errors must use Schema.TaggedErrorClass so their public encoded contract is explicit and testable."
  );
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

const isDirectEnvironmentAccess = (node: ts.PropertyAccessExpression) =>
  node.name.text === "env" &&
  ["process", "globalThis.process", "Bun", "import.meta"].includes(
    node.expression.getText()
  );

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
    names: ["Promise.all", "Promise.race"],
    rule: "raw-promise-coordination",
    message:
      "Owned production concurrency must use Effect.all, Effect.race, or another Effect concurrency primitive.",
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
    names: ["Bun.spawn", "Bun.spawnSync"],
    rule: "direct-platform-process",
    message:
      "Owned source must execute child processes through an Effect platform service supplied by the application root.",
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

const resolveSchemaFields = (
  checker: ts.TypeChecker,
  expression: ts.Expression
): ts.ObjectLiteralExpression | undefined => {
  if (ts.isObjectLiteralExpression(expression)) {
    return expression;
  }
  if (!ts.isIdentifier(expression)) {
    return undefined;
  }
  const symbol = checker.getSymbolAtLocation(expression);
  const target =
    symbol?.flags === ts.SymbolFlags.Alias
      ? checker.getAliasedSymbol(symbol)
      : symbol;
  const initializer = target?.declarations?.find(
    ts.isVariableDeclaration
  )?.initializer;
  return initializer !== undefined && ts.isObjectLiteralExpression(initializer)
    ? initializer
    : undefined;
};

const inspectInlineSchema = (
  checker: ts.TypeChecker,
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
  const fieldsExpression = node.arguments.at(-1);
  if (fieldsExpression === undefined) {
    return;
  }
  const fields = resolveSchemaFields(checker, fieldsExpression);
  if (fields === undefined) {
    return;
  }
  for (const property of fields.properties) {
    if (
      ts.isPropertyAssignment(property) &&
      isRawCauseSchema(property.initializer)
    ) {
      report(
        property,
        "public-raw-cause",
        "Exported Schema structures cannot expose arbitrary defect values. Keep raw causes private and publish only bounded owner-named diagnostics."
      );
    }
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
  inspectInlineSchema(checker, node, report);
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
        isEffectHttpTransportType(node)
      ) {
        report(
          node,
          "public-http-transport",
          "Public domain services cannot expose Effect HTTP request or response transport primitives."
        );
      }
      if (ts.isPropertySignature(node) && isPublicGenericFetchProperty(node)) {
        report(
          node,
          "public-generic-fetch",
          "Public provider configuration cannot expose a generic fetch callback seam."
        );
      }
      if (ts.isClassDeclaration(node)) {
        inspectClassDeclaration(node, report);
      }
      if (ts.isPropertySignature(node) && isOperatorRawCause(node)) {
        report(
          node,
          "operator-raw-cause",
          "Operator errors cannot retain arbitrary unknown values. Classify the failure with bounded secret-negative fields before it reaches an operator receipt."
        );
      }
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
        ts.isPropertyAccessExpression(node) &&
        isDirectEnvironmentAccess(node)
      ) {
        report(
          node,
          "direct-environment-access",
          "Owned source must acquire host configuration through Effect Config rather than reading an ambient environment object."
        );
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
