import { defineAgent } from "eve";

import { agentConfig } from "./config.js";

const modelConfig =
  agentConfig.modelContextWindowTokens === undefined
    ? { model: agentConfig.model }
    : {
        model: agentConfig.model,
        modelContextWindowTokens: agentConfig.modelContextWindowTokens,
      };

export default defineAgent({
  // Keep existing stored-session retention independent of private trace content.
  experimental: { workflow: { retention: "default" } },
  build: {
    externalDependencies: [
      "@bundjil/photon",
      "@grpc/grpc-js",
      "nice-grpc",
      "nice-grpc-common",
    ],
  },
  ...modelConfig,
});
