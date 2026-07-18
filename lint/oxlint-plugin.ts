interface AstNode {
  readonly arguments?: readonly AstNode[];
  readonly callee?: AstNode;
  readonly computed?: boolean;
  readonly name?: string;
  readonly object?: AstNode;
  readonly params?: readonly AstNode[];
  readonly property?: AstNode;
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
  readonly report: (diagnostic: {
    readonly data: Readonly<Record<string, string>>;
    readonly messageId: "mismatch";
    readonly node: AstNode;
  }) => void;
}

interface TaggedErrorNames {
  readonly className: string | undefined;
  readonly selfTypeName: string | undefined;
  readonly tagName: string | undefined;
}

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

export default {
  meta: {
    name: "bundjil",
  },
  rules: {
    "tagged-error-name": taggedErrorNameRule,
  },
};
