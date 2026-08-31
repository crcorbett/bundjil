import { Context, Layer } from "effect";

export interface CodexProxyReadinessContract {
  readonly ready: boolean;
}

export class CodexProxyReadiness extends Context.Service<
  CodexProxyReadiness,
  CodexProxyReadinessContract
>()("@bundjil/codex-proxy/CodexProxyReadiness") {}

export const CodexProxyReadyLive = Layer.succeed(
  CodexProxyReadiness,
  CodexProxyReadiness.of({ ready: true })
);

export const CodexProxyUnavailableLive = Layer.succeed(
  CodexProxyReadiness,
  CodexProxyReadiness.of({ ready: false })
);
