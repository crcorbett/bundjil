import { FetchInstrumentation } from "@vercel/otel";
import { otel } from "eve/instrumentation/otel";

import { agentConfig } from "../config.js";

export default otel({
  tracePolicy: () => ({
    emit: true,
    recordInputs: false,
    recordOutputs: false,
  }),
  instrumentations: [
    new FetchInstrumentation(
      agentConfig.modelProvider.provider === "codex-proxy"
        ? { propagateContextUrls: [agentConfig.modelProvider.baseURL.origin] }
        : {}
    ),
  ],
});
