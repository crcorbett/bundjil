import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

import { toEveSchema } from "../src/eve/tool-adapter.js";
import { WorkspaceStatusInput, WorkspaceStatusSuccess } from "../src/index.js";

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
              message: 'Expected a value with a length of at least 1, got ""',
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
              allOf: [
                {
                  minLength: 1,
                },
              ],
              type: "string",
            },
            packageNames: {
              items: {
                allOf: [
                  {
                    minLength: 1,
                  },
                ],
                type: "string",
              },
              type: "array",
            },
            workspaceName: {
              allOf: [
                {
                  minLength: 1,
                },
              ],
              type: "string",
            },
          },
          required: ["workspaceName", "packageNames", "agentSummary"],
          type: "object",
        }
      );
    })
);
