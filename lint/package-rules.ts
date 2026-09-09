import { Schema } from "effect";

interface AstNode {
  readonly source?: AstNode;
  readonly type: string;
  readonly value?: unknown;
}

interface RuleContext {
  readonly filename?: string;
  readonly getFilename?: () => string;
  readonly report: (diagnostic: {
    readonly messageId: string;
    readonly node: AstNode;
  }) => void;
}

const isString = Schema.is(Schema.String);
const workspaceSourceRootPattern =
  /\/(?:apps|packages)\/(?:[^/]+\/)+?src(?:\/|$)/u;

const sourceFileName = (context: RuleContext) =>
  (context.filename ?? context.getFilename?.() ?? "").replaceAll("\\", "/");

const stringValue = (node: AstNode | undefined) =>
  node?.type === "Literal" && isString(node.value) ? node.value : undefined;

const resolveRelative = (fileName: string, specifier: string) => {
  const segments = fileName.split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "..") {
      segments.pop();
    } else if (segment !== "." && segment.length > 0) {
      segments.push(segment);
    }
  }
  return segments.join("/");
};

const workspaceSourceRoot = (fileName: string) => {
  const match = workspaceSourceRootPattern.exec(fileName);
  return match?.[0]?.replace(/\/$/u, "");
};

const isPrivatePackageAlias = (specifier: string) =>
  /^@[^/]+\/[^/]+\/src(?:\/|$)/u.test(specifier);

const isCrossWorkspaceSourcePath = (fileName: string, specifier: string) => {
  if (!specifier.startsWith(".")) {
    return false;
  }
  const sourceRoot = workspaceSourceRoot(fileName);
  const target = resolveRelative(fileName, specifier);
  const targetRoot = workspaceSourceRoot(target);
  return (
    sourceRoot !== undefined &&
    targetRoot !== undefined &&
    sourceRoot !== targetRoot
  );
};

const noCrossPackageSourceImports = {
  create(context: RuleContext) {
    const fileName = sourceFileName(context);
    const inspect = (node: AstNode) => {
      const specifier = stringValue(node.source);
      if (
        specifier !== undefined &&
        (isPrivatePackageAlias(specifier) ||
          isCrossWorkspaceSourcePath(fileName, specifier))
      ) {
        context.report({
          messageId: "noCrossPackageSourceImports",
          node: node.source ?? node,
        });
      }
    };
    return {
      ExportAllDeclaration: inspect,
      ExportNamedDeclaration: inspect,
      ImportDeclaration: inspect,
      ImportExpression: inspect,
    };
  },
  meta: {
    docs: {
      description:
        "Prevent imports from another workspace's private source tree.",
    },
    messages: {
      noCrossPackageSourceImports:
        "Import the package's public export instead of reaching into another workspace's source folder.",
    },
    type: "problem",
  },
};

export default {
  meta: { name: "package" },
  rules: {
    "no-cross-package-source-imports": noCrossPackageSourceImports,
  },
};
