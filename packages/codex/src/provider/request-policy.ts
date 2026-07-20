import { Context, Layer } from "effect";

import type { CodexResponsesRequestPolicy } from "./contracts.js";

export interface CodexResponsesRequestPolicyServiceShape {
  readonly policy: CodexResponsesRequestPolicy;
}

export class CodexResponsesRequestPolicyService extends Context.Service<
  CodexResponsesRequestPolicyService,
  CodexResponsesRequestPolicyServiceShape
>()("@bundjil/codex/CodexResponsesRequestPolicyService") {}

export const makeCodexResponsesRequestPolicyLayer = (
  policy: CodexResponsesRequestPolicy
) =>
  Layer.succeed(
    CodexResponsesRequestPolicyService,
    CodexResponsesRequestPolicyService.of({ policy })
  );

export const defaultCodexResponsesRequestPolicy = {
  reasoningEffort: "low",
} satisfies CodexResponsesRequestPolicy;

export const CodexResponsesRequestPolicyLowLive =
  makeCodexResponsesRequestPolicyLayer(defaultCodexResponsesRequestPolicy);
