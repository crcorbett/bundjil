import { Effect, Redacted } from "effect";
import { defineMcpClientConnection } from "eve/connections";

import {
  ExecutorConfigProviderLayer,
  loadExecutorApiKey,
  loadExecutorEndpoint,
} from "../lib/executor/config.js";

const endpoint = Effect.runSync(
  loadExecutorEndpoint().pipe(Effect.provide(ExecutorConfigProviderLayer))
);

export default defineMcpClientConnection({
  url: endpoint.toString(),
  description:
    "Executor: use selected connected services under explicit read, approval, and block policies.",
  auth: {
    principalType: "app",
    getToken: async () => {
      const key = await Effect.runPromise(
        loadExecutorApiKey().pipe(Effect.provide(ExecutorConfigProviderLayer))
      );
      return { token: Redacted.value(key) };
    },
  },
  tools: { allow: ["skills", "execute", "resume"] },
});
