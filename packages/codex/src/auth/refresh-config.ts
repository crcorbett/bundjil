import { Config, Context, Effect, Layer, Schema } from "effect";

import { CodexOAuthRefreshPolicy } from "../profiles/contracts.js";
import type { CodexOAuthRefreshPolicy as CodexOAuthRefreshPolicyType } from "../profiles/contracts.js";

const refreshSkewMillisConfig = Config.schema(
  Schema.Int,
  "BUNDJIL_CODEX_REFRESH_SKEW_MILLIS"
).pipe(Config.withDefault(300_000));

const lockTtlMillisConfig = Config.schema(
  Schema.Int,
  "BUNDJIL_CODEX_REFRESH_LOCK_TTL_MILLIS"
).pipe(Config.withDefault(5000));

export class CodexOAuthRefreshPolicyService extends Context.Service<
  CodexOAuthRefreshPolicyService,
  CodexOAuthRefreshPolicyType
>()("@bundjil/codex/CodexOAuthRefreshPolicyService") {}

export const loadCodexOAuthRefreshPolicy = Effect.gen(
  function* loadCodexOAuthRefreshPolicyOperation() {
    const refreshSkewMillis = yield* refreshSkewMillisConfig;
    const lockTtlMillis = yield* lockTtlMillisConfig;

    return yield* Schema.decodeUnknownEffect(CodexOAuthRefreshPolicy)({
      refreshSkewMillis,
      lockTtlMillis,
    });
  }
).pipe(Effect.withSpan("CodexOAuthRefreshPolicy.load"));

export const CodexOAuthRefreshPolicyLive = Layer.effect(
  CodexOAuthRefreshPolicyService,
  loadCodexOAuthRefreshPolicy
);

export const CodexOAuthRefreshPolicyTest = (
  policy: CodexOAuthRefreshPolicyType
) => Layer.succeed(CodexOAuthRefreshPolicyService, policy);
