import type {
  StandardJSONSchemaV1,
  StandardSchemaV1,
} from "@standard-schema/spec";
import { Schema } from "effect";

export type EveSchema<S extends Schema.Decoder<unknown>> = StandardJSONSchemaV1<
  S["Encoded"],
  S["Type"]
> &
  StandardSchemaV1<S["Encoded"], S["Type"]> &
  S;

export const toEveSchema = <S extends Schema.Decoder<unknown>>(
  schema: S
): EveSchema<S> =>
  Schema.toStandardJSONSchemaV1(Schema.toStandardSchemaV1(schema));
