import { registerOTel } from "@vercel/otel";

import { fetchCodexProxyVercelRequest } from "../src/vercel.js";

registerOTel({ serviceName: "bundjil-codex-proxy" });

export default {
  fetch: fetchCodexProxyVercelRequest,
};
