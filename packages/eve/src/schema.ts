import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";
import { Schema } from "effect";

export type EveSchema<S extends Schema.ConstraintDecoder<unknown>> =
  StandardJSONSchemaV1<S["Encoded"], S["Type"]> &
    StandardSchemaV1<S["Encoded"], S["Type"]>;

export const toEveSchema = <S extends Schema.ConstraintDecoder<unknown>>(
  schema: S
): EveSchema<S> => ({
  // Effect schemas can be callable. Eve consumes a plain Standard Schema
  // object; keep the native validators and emitters without its constructor.
  "~standard": Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema))[
    "~standard"
  ],
});
