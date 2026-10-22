import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";
import { JsonSchema, Schema } from "effect";

export type EveSchema<S extends Schema.Decoder<unknown>> = StandardJSONSchemaV1<
  S["Encoded"],
  S["Type"]
> &
  StandardSchemaV1<S["Encoded"], S["Type"]>;

const jsonSchemaFor = (
  schema: Schema.Constraint,
  target: StandardJSONSchemaV1.Target
) => {
  const document = Schema.toJsonSchemaDocument(schema, {
    onExcessProperty: "error",
  });
  if (target === "draft-2020-12") {
    if (Object.keys(document.definitions).length > 0) {
      document.schema["$defs"] = document.definitions;
    }
    return document.schema;
  }
  if (target === "draft-07") {
    const draft = JsonSchema.toDocumentDraft07(document);
    if (Object.keys(draft.definitions).length > 0) {
      draft.schema["definitions"] = draft.definitions;
    }
    return draft.schema;
  }
  throw new Error(`Unsupported JSON Schema target: ${target}`);
};

export const toEveSchema = <S extends Schema.Decoder<unknown>>(
  schema: S
): EveSchema<S> => ({
  "~standard": {
    ...Schema.toStandardSchemaV1(schema.annotate({}), {
      parseOptions: { onExcessProperty: "error" },
    })["~standard"],
    jsonSchema: {
      input: ({ target }) => jsonSchemaFor(schema, target),
      output: ({ target }) => jsonSchemaFor(Schema.toType(schema), target),
    },
  },
});
