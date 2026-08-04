import { registerOTel } from "@vercel/otel";
import { defineInstrumentation } from "eve/instrumentation";

import { agentConfig } from "./config.js";

export default defineInstrumentation({
  recordInputs: false,
  recordOutputs: false,
  setup: ({ agentName }) => {
    registerOTel({
      instrumentationConfig: {
        fetch:
          agentConfig.modelProvider.provider === "codex-proxy"
            ? {
                propagateContextUrls: [
                  agentConfig.modelProvider.baseURL.origin,
                ],
              }
            : {},
      },
      serviceName: agentName,
    });
  },
});
