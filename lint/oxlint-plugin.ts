interface AstNode {
  readonly argument?: AstNode;
  readonly arguments?: readonly AstNode[];
  readonly async?: boolean;
  readonly body?: AstNode | readonly AstNode[];
  readonly callee?: AstNode;
  readonly computed?: boolean;
  readonly expressions?: readonly AstNode[];
  readonly expression?: AstNode;
  readonly id?: AstNode | null;
  readonly imported?: AstNode;
  readonly key?: AstNode;
  readonly local?: AstNode;
  readonly name?: string;
  readonly object?: AstNode;
  readonly operator?: string;
  readonly parent?: AstNode | null;
  readonly params?: readonly AstNode[];
  readonly property?: AstNode;
  readonly properties?: readonly AstNode[];
  readonly source?: AstNode;
  readonly specifiers?: readonly AstNode[];
  readonly type: string;
  readonly typeArguments?: AstNode | null;
  readonly typeName?: AstNode;
  readonly value?: unknown;
}

interface ClassDeclarationNode extends AstNode {
  readonly id: AstNode | null;
  readonly superClass: AstNode | null;
}

interface RuleContext {
  readonly filename?: string;
  readonly getFilename?: () => string;
  readonly report: (diagnostic: {
    readonly data?: Readonly<Record<string, string>>;
    readonly messageId: string;
    readonly node: AstNode;
  }) => void;
}

interface TaggedErrorNames {
  readonly className: string | undefined;
  readonly selfTypeName: string | undefined;
  readonly tagName: string | undefined;
}

interface ExactException {
  readonly expected: Readonly<Record<string, number>>;
  readonly pathSuffix: string;
}

const propertyName = (node: AstNode | undefined) => {
  if (node?.type === "Identifier") {
    return node.name;
  }
  return node?.type === "Literal" ? String(node.value) : undefined;
};

const importSource = (node: AstNode) =>
  typeof node.source?.value === "string" ? node.source.value : "";

const importedName = (node: AstNode) =>
  node.type === "ImportSpecifier" ? propertyName(node.imported) : undefined;

const localName = (node: AstNode) =>
  node.local?.type === "Identifier" ? node.local.name : undefined;

const normalizedFilename = (context: RuleContext) =>
  (context.filename ?? context.getFilename?.() ?? "").replaceAll("\\", "/");

const memberName = (node: AstNode | undefined) =>
  node?.type === "MemberExpression" &&
  node.computed !== true &&
  node.object?.type === "Identifier" &&
  node.property?.type === "Identifier"
    ? `${node.object.name}.${node.property.name}`
    : undefined;

const propertyExists = (node: AstNode, name: string) =>
  node.properties?.some(
    (property) =>
      property.type === "Property" && propertyName(property.key) === name
  ) === true;

const isFunctionNode = (node: AstNode | undefined) =>
  node?.type === "ArrowFunctionExpression" ||
  node?.type === "FunctionDeclaration" ||
  node?.type === "FunctionExpression";

const unwrapExpression = (node: AstNode | undefined): AstNode | undefined => {
  let current = node;
  while (
    current !== undefined &&
    (current.type === "ChainExpression" ||
      current.type === "ParenthesizedExpression" ||
      current.type === "TSAsExpression" ||
      current.type === "TSNonNullExpression" ||
      current.type === "TSTypeAssertion")
  ) {
    current = current.expression;
  }
  return current;
};

const isPrimitiveExpression = (node: AstNode | undefined): boolean => {
  const expression = unwrapExpression(node);
  if (expression?.type === "Literal") {
    return (
      expression.value === null ||
      typeof expression.value === "string" ||
      typeof expression.value === "number" ||
      typeof expression.value === "boolean" ||
      typeof expression.value === "bigint"
    );
  }
  if (expression?.type === "TemplateLiteral") {
    return true;
  }
  if (expression?.type === "Identifier" && expression.name === "undefined") {
    return true;
  }
  return (
    expression?.type === "UnaryExpression" &&
    expression.operator !== "delete" &&
    (expression.operator === "!" ||
      expression.operator === "void" ||
      isPrimitiveExpression(expression.argument))
  );
};

const isAstNodeArray = (
  value: AstNode | readonly AstNode[] | undefined
): value is readonly AstNode[] => Array.isArray(value);

const returnsPrimitiveExpression = (node: AstNode | undefined): boolean => {
  const callback = unwrapExpression(node);
  if (
    callback?.type !== "ArrowFunctionExpression" &&
    callback?.type !== "FunctionExpression"
  ) {
    return false;
  }
  const { body } = callback;
  if (isAstNodeArray(body)) {
    return false;
  }
  if (body?.type !== "BlockStatement") {
    return isPrimitiveExpression(body);
  }
  const statements = body.body;
  return (
    isAstNodeArray(statements) &&
    statements.some(
      (statement) =>
        statement.type === "ReturnStatement" &&
        isPrimitiveExpression(statement.argument)
    )
  );
};

const createEffectTracker = () => {
  const namespaces = new Map<string, "Effect" | "Layer" | "ManagedRuntime">();
  const methods = new Map<string, string>();

  return {
    importDeclaration(node: AstNode) {
      const source = importSource(node);
      for (const specifier of node.specifiers ?? []) {
        const local = localName(specifier);
        if (local === undefined) {
          continue;
        }
        if (source === "effect") {
          const imported = importedName(specifier);
          if (
            imported === "Effect" ||
            imported === "Layer" ||
            imported === "ManagedRuntime"
          ) {
            namespaces.set(local, imported);
          }
        } else if (source === "effect/Effect") {
          const imported = importedName(specifier);
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaces.set(local, "Effect");
          } else if (imported !== undefined) {
            methods.set(local, `Effect.${imported}`);
          }
        } else if (source === "effect/Layer") {
          const imported = importedName(specifier);
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaces.set(local, "Layer");
          } else if (imported !== undefined) {
            methods.set(local, `Layer.${imported}`);
          }
        } else if (source === "effect/ManagedRuntime") {
          const imported = importedName(specifier);
          if (specifier.type === "ImportNamespaceSpecifier") {
            namespaces.set(local, "ManagedRuntime");
          } else if (imported !== undefined) {
            methods.set(local, `ManagedRuntime.${imported}`);
          }
        }
      }
    },
    referenceName(node: AstNode | undefined) {
      if (
        node?.type === "MemberExpression" &&
        node.object?.type === "Identifier"
      ) {
        const namespace = namespaces.get(node.object.name ?? "");
        const property = propertyName(node.property);
        return namespace !== undefined && property !== undefined
          ? `${namespace}.${property}`
          : undefined;
      }
      return node?.type === "Identifier"
        ? methods.get(node.name ?? "")
        : undefined;
    },
  };
};

const isAllowedPromiseBoundaryFunction = (
  node: AstNode,
  tracker: ReturnType<typeof createEffectTracker>
) => {
  const { parent } = node;
  if (
    parent?.type === "CallExpression" &&
    parent.arguments?.[0] === node &&
    tracker.referenceName(parent.callee) === "Effect.promise"
  ) {
    return true;
  }
  const property = parent?.type === "Property" ? parent : undefined;
  const options = property?.parent;
  const call = options?.parent;
  return (
    propertyName(property?.key) === "try" &&
    options?.type === "ObjectExpression" &&
    call?.type === "CallExpression" &&
    tracker.referenceName(call.callee) === "Effect.tryPromise"
  );
};

const isInsideAllowedPromiseBoundary = (
  node: AstNode,
  tracker: ReturnType<typeof createEffectTracker>
) => {
  let current = node.parent;
  while (current !== undefined && current !== null) {
    if (isFunctionNode(current)) {
      return isAllowedPromiseBoundaryFunction(current, tracker);
    }
    current = current.parent;
  }
  return false;
};

const createExactExceptionTracker = (
  context: RuleContext,
  exceptions: readonly ExactException[]
) => {
  const filename = normalizedFilename(context);
  const exception = exceptions.find(({ pathSuffix }) =>
    filename.endsWith(pathSuffix)
  );
  const observed = new Map<string, number>();

  return {
    accepts(key: string) {
      if (exception?.expected[key] === undefined) {
        return false;
      }
      const count = (observed.get(key) ?? 0) + 1;
      observed.set(key, count);
      return count <= exception.expected[key];
    },
    verify(node: AstNode) {
      if (exception === undefined) {
        return;
      }
      const mismatch = Object.entries(exception.expected).find(
        ([key, count]) => observed.get(key) !== count
      );
      if (mismatch !== undefined) {
        context.report({
          data: {
            expected: String(mismatch[1]),
            key: mismatch[0],
            observed: String(observed.get(mismatch[0]) ?? 0),
          },
          messageId: "staleException",
          node,
        });
      }
    },
  };
};

export const ambientTimeExceptions = [
  {
    pathSuffix: "apps/codex-proxy/test/prove-preview.test.ts",
    expected: { "Date.now": 2, setTimeout: 1 },
  },
] as const satisfies readonly ExactException[];

export const asyncAwaitExceptions = [
  {
    pathSuffix: "packages/photon/src/client.ts",
    expected: { async: 2, await: 3 },
  },
  {
    pathSuffix: "apps/agent/agent/lib/channel/eve.ts",
    expected: { async: 1, await: 1 },
  },
  {
    pathSuffix: "apps/agent/agent/connections/executor.ts",
    expected: { async: 1, await: 1 },
  },
  {
    pathSuffix: "apps/codex-proxy/src/vercel.ts",
    expected: { async: 3, await: 3 },
  },
  {
    pathSuffix: "apps/codex-proxy/src/dev.ts",
    expected: { await: 1 },
  },
] as const satisfies readonly ExactException[];

export const runtimeExecutionExceptions = [
  {
    pathSuffix: "apps/agent/agent/channels/photon.ts",
    expected: { "ManagedRuntime.make": 1 },
  },
  {
    pathSuffix: "apps/agent/agent/channels/sendblue.ts",
    expected: { "ManagedRuntime.make": 1 },
  },
  {
    pathSuffix: "apps/agent/agent/config.ts",
    expected: { "Effect.runSync": 1 },
  },
  {
    pathSuffix: "apps/agent/agent/connections/executor.ts",
    expected: { "Effect.runPromise": 1, "Effect.runSync": 1 },
  },
  {
    pathSuffix: "apps/agent/agent/tools/workspace_status.ts",
    expected: { "Effect.runPromise": 1 },
  },
  {
    pathSuffix: "apps/codex-proxy/src/dev.ts",
    expected: { "Effect.runPromise": 1 },
  },
] as const satisfies readonly ExactException[];

const isSchemaTaggedErrorClass = (node: AstNode | undefined) =>
  node?.type === "MemberExpression" &&
  node.computed !== true &&
  node.object?.type === "Identifier" &&
  node.object.name === "Schema" &&
  node.property?.type === "Identifier" &&
  node.property.name === "TaggedErrorClass";

const taggedErrorNames = (
  node: ClassDeclarationNode
): TaggedErrorNames | undefined => {
  const taggedErrorConstructor = node.superClass;
  if (taggedErrorConstructor?.type !== "CallExpression") {
    return undefined;
  }

  const taggedErrorFactory = taggedErrorConstructor.callee;
  if (
    taggedErrorFactory?.type !== "CallExpression" ||
    !isSchemaTaggedErrorClass(taggedErrorFactory.callee)
  ) {
    return undefined;
  }

  const selfType = taggedErrorFactory.typeArguments?.params?.[0];
  const tag = taggedErrorConstructor.arguments?.[0];

  return {
    className: node.id?.type === "Identifier" ? node.id.name : undefined,
    selfTypeName:
      selfType?.type === "TSTypeReference" &&
      selfType.typeName?.type === "Identifier"
        ? selfType.typeName.name
        : undefined,
    tagName:
      tag?.type === "Literal" && typeof tag.value === "string"
        ? tag.value
        : undefined,
  };
};

export const taggedErrorNameRule = {
  create(context: RuleContext) {
    return {
      ClassDeclaration(node: ClassDeclarationNode) {
        const names = taggedErrorNames(node);
        if (names === undefined) {
          return;
        }

        if (
          names.className === undefined ||
          names.selfTypeName !== names.className ||
          names.tagName !== names.className
        ) {
          context.report({
            data: {
              className: names.className ?? "<missing>",
              selfTypeName: names.selfTypeName ?? "<missing>",
              tagName: names.tagName ?? "<missing>",
            },
            messageId: "mismatch",
            node,
          });
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        "Require Schema.TaggedErrorClass declaration, self-type, and literal tag names to agree.",
    },
    messages: {
      mismatch:
        "Schema.TaggedErrorClass names must agree (class: {{className}}, self-type: {{selfTypeName}}, tag: {{tagName}}).",
    },
    type: "problem",
  },
};

const isNamedMemberCall = (node: AstNode, name: string) =>
  node.type === "CallExpression" && memberName(node.callee) === name;

const classifyIntrinsicAmbientCall = (
  node: AstNode
): readonly [key: string, messageId: string] | undefined => {
  if (isNamedMemberCall(node, "Date.now")) {
    return ["Date.now", "noDateNow"];
  }
  return isNamedMemberCall(node, "Bun.sleep")
    ? ["Bun.sleep", "noBunSleep"]
    : undefined;
};

const classifyTestClockEscape = (
  node: AstNode,
  aliases: ReadonlySet<string>
): readonly [key: string, messageId: string] | undefined =>
  node.callee?.type === "MemberExpression" &&
  node.callee.object?.type === "Identifier" &&
  aliases.has(node.callee.object.name ?? "") &&
  propertyName(node.callee.property) === "withLive"
    ? ["TestClock.withLive", "noTestClockWithLive"]
    : undefined;

const classifyTimerCall = (
  node: AstNode,
  aliases: ReadonlyMap<string, "setInterval" | "setTimeout">,
  namespaces: ReadonlySet<string>
): readonly [key: string, messageId: string] | undefined => {
  if (node.callee?.type === "Identifier") {
    const name = node.callee.name ?? "";
    const timer =
      aliases.get(name) ??
      (name === "setTimeout" || name === "setInterval" ? name : undefined);
    return timer === undefined ? undefined : [timer, `no${timer}`];
  }
  if (
    node.callee?.type !== "MemberExpression" ||
    node.callee.object?.type !== "Identifier" ||
    !namespaces.has(node.callee.object.name ?? "")
  ) {
    return undefined;
  }
  const timer = propertyName(node.callee.property);
  return timer === "setTimeout" || timer === "setInterval"
    ? [timer, `no${timer}`]
    : undefined;
};

export const noAmbientTimeInEffectRule = {
  create(context: RuleContext) {
    const exceptions = createExactExceptionTracker(
      context,
      ambientTimeExceptions
    );
    const timerAliases = new Map<string, "setInterval" | "setTimeout">();
    const timerNamespaces = new Set<string>();
    const testClockAliases = new Set<string>(["TestClock"]);
    const report = (node: AstNode, key: string, messageId: string) => {
      if (!exceptions.accepts(key)) {
        context.report({ messageId, node });
      }
    };

    return {
      CallExpression(node: AstNode) {
        const classification =
          classifyIntrinsicAmbientCall(node) ??
          classifyTestClockEscape(node, testClockAliases) ??
          classifyTimerCall(node, timerAliases, timerNamespaces);
        if (classification !== undefined) {
          report(node.callee ?? node, classification[0], classification[1]);
        }
      },
      ImportDeclaration(node: AstNode) {
        const source = importSource(node);
        if (source === "node:timers" || source === "node:timers/promises") {
          for (const specifier of node.specifiers ?? []) {
            const local = localName(specifier);
            const imported = importedName(specifier);
            if (
              local !== undefined &&
              (imported === "setTimeout" || imported === "setInterval")
            ) {
              timerAliases.set(local, imported);
            } else if (
              local !== undefined &&
              specifier.type === "ImportNamespaceSpecifier"
            ) {
              timerNamespaces.add(local);
            }
          }
        }
        if (source === "effect/testing") {
          for (const specifier of node.specifiers ?? []) {
            if (importedName(specifier) === "TestClock") {
              const local = localName(specifier);
              if (local !== undefined) {
                testClockAliases.add(local);
              }
            }
          }
        }
      },
      NewExpression(node: AstNode) {
        if (
          node.callee?.type === "Identifier" &&
          node.callee.name === "Date" &&
          (node.arguments?.length ?? 0) === 0
        ) {
          report(node.callee, "new Date()", "noNewDate");
        }
      },
      "Program:exit"(node: AstNode) {
        exceptions.verify(node);
      },
    };
  },
  meta: {
    docs: {
      description:
        "Require Effect Clock and TestClock in deterministic Effect-owned code.",
    },
    messages: {
      noBunSleep:
        "Use Effect.sleep and TestClock instead of Bun.sleep in Effect-owned code.",
      noDateNow:
        "Use Clock.currentTimeMillis or a fixed decoded epoch instead of Date.now.",
      noNewDate:
        "Use Clock.currentTimeMillis and construct Date from the explicit epoch instead of ambient new Date().",
      noTestClockWithLive:
        "Do not escape TestClock for time operations; fork, adjust or set time, then join.",
      nosetInterval:
        "Use Effect scheduling and TestClock instead of setInterval in Effect-owned code.",
      nosetTimeout:
        "Use Effect.sleep or timeout with TestClock instead of setTimeout in Effect-owned code.",
      staleException:
        "Ambient-time exception {{key}} is stale: expected {{expected}} occurrence(s), observed {{observed}}.",
    },
    type: "problem",
  },
};

export const noAsyncAwaitInEffectServiceRule = {
  create(context: RuleContext) {
    const tracker = createEffectTracker();
    const exceptions = createExactExceptionTracker(
      context,
      asyncAwaitExceptions
    );
    const report = (node: AstNode, key: string, messageId: string) => {
      if (!exceptions.accepts(key)) {
        context.report({ messageId, node });
      }
    };
    const reportAsync = (node: AstNode) => {
      if (
        node.async === true &&
        !isAllowedPromiseBoundaryFunction(node, tracker)
      ) {
        report(node, "async", "noAsync");
      }
    };

    return {
      ArrowFunctionExpression: reportAsync,
      AwaitExpression(node: AstNode) {
        if (!isInsideAllowedPromiseBoundary(node, tracker)) {
          report(node, "await", "noAwait");
        }
      },
      FunctionDeclaration: reportAsync,
      FunctionExpression: reportAsync,
      ImportDeclaration(node: AstNode) {
        tracker.importDeclaration(node);
      },
      NewExpression(node: AstNode) {
        if (
          node.callee?.type === "Identifier" &&
          node.callee.name === "Promise" &&
          !isInsideAllowedPromiseBoundary(node, tracker)
        ) {
          report(node.callee, "new Promise", "noPromise");
        }
      },
      "Program:exit"(node: AstNode) {
        exceptions.verify(node);
      },
    };
  },
  meta: {
    docs: {
      description:
        "Confine async, await and Promise construction to direct Effect promise ingress callbacks.",
    },
    messages: {
      noAsync:
        "Return an Effect from service code; async functions are allowed only as the direct Effect.promise callback or Effect.tryPromise try callback.",
      noAwait:
        "Compose service work with Effect; await is allowed only inside the direct Promise ingress callback.",
      noPromise:
        "Use Effect.async, Effect.promise or object-form Effect.tryPromise at the owning adapter boundary.",
      staleException:
        "Async/await exception {{key}} is stale: expected {{expected}} occurrence(s), observed {{observed}}.",
    },
    type: "problem",
  },
};

export const requireTryPromiseCatchRule = {
  create(context: RuleContext) {
    const tracker = createEffectTracker();
    return {
      CallExpression(node: AstNode) {
        if (tracker.referenceName(node.callee) !== "Effect.tryPromise") {
          return;
        }
        const options = node.arguments?.[0];
        if (
          options?.type !== "ObjectExpression" ||
          !propertyExists(options, "try") ||
          !propertyExists(options, "catch")
        ) {
          context.report({
            messageId: "requireCatch",
            node: node.callee ?? node,
          });
        }
      },
      ImportDeclaration(node: AstNode) {
        tracker.importDeclaration(node);
      },
    };
  },
  meta: {
    docs: {
      description:
        "Require object-form Effect.tryPromise with explicit try and catch rejection mapping.",
    },
    messages: {
      requireCatch:
        "Use Effect.tryPromise({ try, catch }) and map rejection to the boundary's safe tagged error.",
    },
    type: "problem",
  },
};

export const noPrimitiveEffectFailureRule = {
  create(context: RuleContext) {
    const tracker = createEffectTracker();
    return {
      CallExpression(node: AstNode) {
        const method = tracker.referenceName(node.callee);
        const argument = node.arguments?.[0];
        if (
          (method === "Effect.fail" && isPrimitiveExpression(argument)) ||
          (method === "Effect.failSync" &&
            returnsPrimitiveExpression(argument)) ||
          (method === "Effect.mapError" && returnsPrimitiveExpression(argument))
        ) {
          context.report({
            messageId: "noPrimitiveFailure",
            node: node.callee ?? node,
          });
        }
      },
      ImportDeclaration(node: AstNode) {
        tracker.importDeclaration(node);
      },
    };
  },
  meta: {
    docs: {
      description:
        "Require owner-named typed failures instead of primitive Effect error values.",
    },
    messages: {
      noPrimitiveFailure:
        "Fail with an owner-named tagged error; primitive Effect error values cannot form a closed, matchable boundary.",
    },
    type: "problem",
  },
};

export const noLayerOrDieInServiceRule = {
  create(context: RuleContext) {
    const tracker = createEffectTracker();
    return {
      CallExpression(node: AstNode) {
        if (tracker.referenceName(node.callee) === "Layer.orDie") {
          context.report({
            messageId: "noLayerOrDie",
            node: node.callee ?? node,
          });
        }
      },
      ImportDeclaration(node: AstNode) {
        tracker.importDeclaration(node);
      },
    };
  },
  meta: {
    docs: {
      description:
        "Keep fallible Layer acquisition in the typed error channel outside exact host-framework constraints.",
    },
    messages: {
      noLayerOrDie:
        "Preserve the Layer's typed construction error; Layer.orDie is allowed only at an exact host boundary whose framework contract requires an infallible Layer.",
    },
    type: "problem",
  },
};

const runtimeMethodNames = new Set([
  "Effect.runFork",
  "Effect.runPromise",
  "Effect.runPromiseExit",
  "Effect.runSync",
  "Effect.runSyncExit",
  "ManagedRuntime.make",
]);

const genericRuntimeOwner = (filename: string) =>
  /(?:^|\/)(?:scripts?|test|tests|testing)\//u.test(filename) ||
  /\.(?:test|spec)\.(?:ts|tsx|mts|cts)$/u.test(filename) ||
  /(?:^|\/)(?:index|main|server|runtime|_runtime)\.(?:ts|mts|cts)$/u.test(
    filename
  ) ||
  /\.(?:runtime|layer)\.(?:ts|mts|cts)$/u.test(filename);

export const noRuntimeExecutionOutsideBoundaryRule = {
  create(context: RuleContext) {
    const filename = normalizedFilename(context);
    const tracker = createEffectTracker();
    const exceptions = createExactExceptionTracker(
      context,
      runtimeExecutionExceptions
    );
    const bunRuntimeAliases = new Set<string>(["BunRuntime"]);
    const report = (node: AstNode, key: string) => {
      if (!genericRuntimeOwner(filename) && !exceptions.accepts(key)) {
        context.report({ messageId: "noRuntimeExecution", node });
      }
    };

    return {
      CallExpression(node: AstNode) {
        const tracked = tracker.referenceName(node.callee);
        if (tracked !== undefined && runtimeMethodNames.has(tracked)) {
          report(node.callee ?? node, tracked);
          return;
        }
        if (
          node.callee?.type === "MemberExpression" &&
          node.callee.object?.type === "Identifier" &&
          bunRuntimeAliases.has(node.callee.object.name ?? "") &&
          propertyName(node.callee.property) === "runMain"
        ) {
          report(node.callee, "BunRuntime.runMain");
        }
      },
      ImportDeclaration(node: AstNode) {
        tracker.importDeclaration(node);
        const source = importSource(node);
        if (
          source === "@effect/platform-bun" ||
          source.endsWith("/BunRuntime")
        ) {
          for (const specifier of node.specifiers ?? []) {
            const local = localName(specifier);
            if (
              local !== undefined &&
              (importedName(specifier) === "BunRuntime" ||
                specifier.type === "ImportNamespaceSpecifier")
            ) {
              bunRuntimeAliases.add(local);
            }
          }
        }
      },
      "Program:exit"(node: AstNode) {
        if (!genericRuntimeOwner(filename)) {
          exceptions.verify(node);
        }
      },
    };
  },
  meta: {
    docs: {
      description:
        "Restrict Effect runtime execution and ManagedRuntime ownership to named boundaries.",
    },
    messages: {
      noRuntimeExecution:
        "Return an Effect from service code; runtime execution belongs in a script, test, app entrypoint, runtime/layer module or exact registered framework adapter.",
      staleException:
        "Runtime exception {{key}} is stale: expected {{expected}} occurrence(s), observed {{observed}}.",
    },
    type: "problem",
  },
};

export default {
  meta: {
    name: "bundjil",
  },
  rules: {
    "no-ambient-time-in-effect": noAmbientTimeInEffectRule,
    "no-async-await-in-effect-service": noAsyncAwaitInEffectServiceRule,
    "no-layer-or-die-in-service": noLayerOrDieInServiceRule,
    "no-primitive-effect-failure": noPrimitiveEffectFailureRule,
    "no-runtime-execution-outside-boundary":
      noRuntimeExecutionOutsideBoundaryRule,
    "require-try-promise-catch": requireTryPromiseCatchRule,
    "tagged-error-name": taggedErrorNameRule,
  },
};
