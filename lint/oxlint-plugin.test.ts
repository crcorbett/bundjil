import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import { taggedErrorNameRule } from "./oxlint-plugin.js";

describe("bundjil/tagged-error-name", () => {
  it("enforces matching tagged-error contract names", () => {
    RuleTester.describe = (_text, method) => {
      method();
    };
    RuleTester.it = (_text, method) => {
      method();
    };

    const ruleTester = new RuleTester({
      languageOptions: {
        parserOptions: {
          lang: "ts",
        },
      },
    });

    expect(() => {
      ruleTester.run("tagged-error-name", taggedErrorNameRule, {
        valid: [
          `
          class ExampleError extends Schema.TaggedErrorClass<ExampleError>()(
            "ExampleError",
            {}
          ) {}
        `,
          "class OrdinaryClass {}",
        ],
        invalid: [
          {
            code: `
            class WrongDeclaration extends Schema.TaggedErrorClass<ExampleError>()(
              "ExampleError",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
          {
            code: `
            class ExampleError extends Schema.TaggedErrorClass<WrongSelfType>()(
              "ExampleError",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
          {
            code: `
            class ExampleError extends Schema.TaggedErrorClass<ExampleError>()(
              "WrongLiteralTag",
              {}
            ) {}
          `,
            errors: [{ messageId: "mismatch" }],
          },
        ],
      });
    }).not.toThrow();
  });
});
