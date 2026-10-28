import { FetchInstrumentation } from "@vercel/otel";
import { otel } from "eve/instrumentation/otel";

import { agentConfig } from "../config.js";

export default otel({
  instrumentations: [
    // oxlint-disable-next-line typescript/no-unsafe-call -- @vercel/otel ships an extensionless declaration re-export for this public constructor.
    new FetchInstrumentation(
      agentConfig.modelProvider.provider === "codex-proxy"
        ? {
            propagateContextUrls: [agentConfig.modelProvider.baseURL.origin],
          }
        : {}
    ),
  ],
  tracePolicy: () => ({
    emit: true,
    recordInputs: false,
    recordOutputs: false,
  }),
});
