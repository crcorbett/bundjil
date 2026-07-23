import { defineAgent } from "eve";

import { agentConfig } from "./config.js";

export default defineAgent({
  build: {
    externalDependencies: [
      "@bundjil/photon",
      "@grpc/grpc-js",
      "nice-grpc",
      "nice-grpc-common",
    ],
  },
  model: agentConfig.model,
  ...(agentConfig.modelContextWindowTokens === undefined
    ? {}
    : { modelContextWindowTokens: agentConfig.modelContextWindowTokens }),
});
