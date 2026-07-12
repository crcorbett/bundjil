import { Context, Layer } from "effect";

export interface CodexProxyReadinessShape {
  readonly ready: boolean;
}

export class CodexProxyReadiness extends Context.Service<
  CodexProxyReadiness,
  CodexProxyReadinessShape
>()("@bundjil/codex-proxy/CodexProxyReadiness") {}

export const CodexProxyReadyLive = Layer.succeed(
  CodexProxyReadiness,
  CodexProxyReadiness.of({ ready: true })
);

export const CodexProxyUnavailableLive = Layer.succeed(
  CodexProxyReadiness,
  CodexProxyReadiness.of({ ready: false })
);
