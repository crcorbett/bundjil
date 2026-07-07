import { Effect } from "effect";

import {
  codexProxyWebHandler,
  loadCodexProxyConfigFromEnv,
  loadCodexProxyDevServerConfigFromEnv,
} from "./index.js";

const runDevServer = Effect.gen(function* runCodexProxyDevServer() {
  const devServerConfig = yield* loadCodexProxyDevServerConfigFromEnv;

  yield* loadCodexProxyConfigFromEnv;

  return Bun.serve({
    fetch: (request) => codexProxyWebHandler.handler(request),
    port: devServerConfig.port,
  });
});

const server = await Effect.runPromise(runDevServer);

console.log(`Bundjil Codex proxy listening on ${server.url.toString()}`);
