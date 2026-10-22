import { assert, it } from "@effect/vitest";
import { Effect, Schema } from "effect";

import { WorkspaceStatusInput, WorkspaceStatusSuccess } from "../src/index.js";
import { toEveSchema } from "../src/schema.js";

it.effect(
  "adds Standard Schema validation and Standard JSON Schema metadata",
  () =>
    Effect.sync(() => {
      const inputSchema = toEveSchema(WorkspaceStatusInput);
      const outputSchema = toEveSchema(WorkspaceStatusSuccess);

      assert.isFunction(inputSchema["~standard"].validate);
      assert.isFunction(inputSchema["~standard"].jsonSchema.input);
      assert.isFunction(outputSchema["~standard"].jsonSchema.output);

      assert.deepStrictEqual(
        inputSchema["~standard"].validate({ question: "" }),
        {
          issues: [
            {
              message: "Expected a value with a length of at least 1",
              path: ["question"],
            },
          ],
        }
      );

      assert.deepStrictEqual(
        outputSchema["~standard"].jsonSchema.output({
          target: "draft-2020-12",
        }),
        {
          additionalProperties: false,
          properties: {
            agentSummary: {
              minLength: 1,
              type: "string",
            },
            packageNames: {
              items: {
                minLength: 1,
                type: "string",
              },
              type: "array",
            },
            workspaceName: {
              minLength: 1,
              type: "string",
            },
          },
          required: ["workspaceName", "packageNames", "agentSummary"],
          type: "object",
        }
      );
    })
);

it.effect(
  "keeps nested JSON descriptions and runtime validation equally strict",
  () =>
    Effect.gen(function* () {
      const schema = toEveSchema(
        Schema.Struct({
          value: Schema.Struct({ label: Schema.String }).annotate({
            identifier: "NestedValue",
          }),
        })
      );
      const valid = yield* Effect.promise(() =>
        Promise.resolve(
          schema["~standard"].validate({ value: { label: "ok" } })
        )
      );
      const extra = yield* Effect.promise(() =>
        Promise.resolve(
          schema["~standard"].validate({ value: { label: "ok", extra: true } })
        )
      );
      assert.deepStrictEqual(valid, { value: { value: { label: "ok" } } });
      assert.isDefined(extra.issues);
      const current = schema["~standard"].jsonSchema.input({
        target: "draft-2020-12",
      });
      const legacy = schema["~standard"].jsonSchema.input({
        target: "draft-07",
      });
      assert.property(current, "$defs");
      assert.property(legacy, "definitions");
      assert.propertyVal(current, "additionalProperties", false);
      assert.propertyVal(legacy, "additionalProperties", false);
      assert.throws(() => {
        schema["~standard"].jsonSchema.input({ target: "unsupported" });
      }, "Unsupported JSON Schema target");
    })
);
