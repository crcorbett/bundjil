import { defineAgent } from "eve";

import { agentConfig } from "./config.js";

export default defineAgent({
  build: {
    externalDependencies: ["@bundjil/photon"],
  },
  model: agentConfig.model,
  ...(agentConfig.modelContextWindowTokens === undefined
    ? {}
    : { modelContextWindowTokens: agentConfig.modelContextWindowTokens }),
});
