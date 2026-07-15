import { assert, it } from "@effect/vitest";
import { generateText } from "ai";
import { ConfigProvider, Effect, Schema } from "effect";

import {
  loadAgentConfig,
  loadAgentModelProviderConfig,
} from "../agent/config.js";
import {
  createAgentModel,
  defaultAgentModel,
} from "../agent/model-provider.js";
import type { AgentModelProviderDeps } from "../agent/model-provider.js";

const OpenAICompatibleGenerateResponse = Schema.Struct({
  choices: Schema.Array(
    Schema.Struct({
      finish_reason: Schema.String,
      index: Schema.Number,
      message: Schema.Struct({
        content: Schema.String,
        role: Schema.Literal("assistant"),
      }),
    })
  ),
  created: Schema.Number,
  id: Schema.String,
  model: Schema.String,
  object: Schema.Literal("chat.completion"),
  usage: Schema.Struct({
    completion_tokens: Schema.Number,
    prompt_tokens: Schema.Number,
    total_tokens: Schema.Number,
  }),
});

const encodeOpenAICompatibleGenerateResponse = Schema.encodeSync(
  Schema.fromJsonString(OpenAICompatibleGenerateResponse)
);

it.effect("selects the Gateway model string by default", () =>
  Effect.gen(function* testDefaultGatewayProvider() {
    const config = yield* loadAgentConfig().pipe(
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnv({
            env: {},
          })
        )
      )
    );

    assert.strictEqual(config.model, defaultAgentModel);
    assert.deepStrictEqual(config.modelProvider, {
      model: defaultAgentModel,
      provider: "gateway",
    });
  })
);

it.effect(
  "builds a Codex proxy LanguageModel with private bearer auth and injected fetch",
  () =>
    Effect.gen(function* testCodexProxyProvider() {
      const config = yield* loadAgentModelProviderConfig.pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromEnv({
              env: {
                BUNDJIL_AGENT_MODEL: "codex-default-model",
                BUNDJIL_AGENT_MODEL_PROVIDER: "codex-proxy",
                BUNDJIL_CODEX_PROXY_BASE_URL: "http://127.0.0.1:8787/v1",
                BUNDJIL_CODEX_PROXY_CONTEXT_WINDOW_TOKENS: "123456",
                BUNDJIL_CODEX_PROXY_INTERNAL_TOKEN: "test-internal-token",
                BUNDJIL_CODEX_PROXY_VERCEL_BYPASS: "test-protection-bypass",
              },
            })
          )
        )
      );
      const requests: {
        authorization: string | null;
        body: string | undefined;
        contentType: string | null;
        protectionBypass: string | null;
        url: string;
      }[] = [];
      const fetch = Object.assign(
        (input: RequestInfo | URL, init?: RequestInit) => {
          const headers = new Headers(init?.headers);
          let requestUrl: string;

          if (typeof input === "string") {
            requestUrl = input;
          } else if (input instanceof URL) {
            requestUrl = input.href;
          } else {
            requestUrl = input.url;
          }

          requests.push({
            authorization: headers.get("authorization"),
            body: typeof init?.body === "string" ? init.body : undefined,
            contentType: headers.get("content-type"),
            protectionBypass: headers.get("x-vercel-protection-bypass"),
            url: requestUrl,
          });

          return Promise.resolve(
            new Response(
              encodeOpenAICompatibleGenerateResponse({
                choices: [
                  {
                    finish_reason: "stop",
                    index: 0,
                    message: {
                      content: "OK",
                      role: "assistant",
                    },
                  },
                ],
                created: 1_700_000_000,
                id: "chatcmpl-bundjil-agent-test",
                model: "codex-default-model",
                object: "chat.completion",
                usage: {
                  completion_tokens: 1,
                  prompt_tokens: 1,
                  total_tokens: 2,
                },
              }),
              {
                headers: {
                  "content-type": "application/json",
                },
                status: 200,
              }
            )
          );
        },
        {
          preconnect: globalThis.fetch.preconnect,
        }
      ) satisfies NonNullable<AgentModelProviderDeps["fetch"]>;
      const model = createAgentModel(config, { fetch });

      if (typeof model === "string") {
        throw new TypeError(
          "Expected Codex proxy mode to create a LanguageModel."
        );
      }

      if (config.provider !== "codex-proxy") {
        throw new Error("Expected Codex proxy model provider config.");
      }

      assert.strictEqual(config.model, "codex-default-model");
      assert.strictEqual(config.baseURL.href, "http://127.0.0.1:8787/v1");
      assert.strictEqual(config.modelContextWindowTokens, 123_456);
      assert.strictEqual(model.modelId, "codex-default-model");
      assert.strictEqual(model.provider, "bundjil-codex-proxy.chat");
      assert.strictEqual(model.specificationVersion, "v4");

      const result = yield* Effect.promise(() =>
        generateText({
          model,
          prompt: "Say OK.",
        })
      );
      const [request] = requests;

      if (request === undefined) {
        throw new Error("Expected the injected fetch to receive a request.");
      }

      assert.strictEqual(
        request.url,
        "http://127.0.0.1:8787/v1/chat/completions"
      );
      assert.strictEqual(request.authorization, "Bearer test-internal-token");
      assert.strictEqual(request.protectionBypass, "test-protection-bypass");
      assert.include(request.contentType, "application/json");
      assert.strictEqual(result.text, "OK");
      assert.notInclude(request.body ?? "", "test-internal-token");
      assert.notInclude(request.body ?? "", "test-protection-bypass");
    })
);
