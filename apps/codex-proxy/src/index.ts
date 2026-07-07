import { codexProxyWebHandler } from "./server.js";

export {
  CodexProxyAppLive,
  CodexProxyRoutesLive,
  codexProxyWebHandler,
  makeCodexProxyAppLayer,
  makeCodexProxyWebHandler,
} from "./server.js";
export {
  CodexProxyConfig,
  CodexProxyConfigLayer,
  CodexProxyConfigLive,
  loadCodexProxyConfig,
  loadCodexProxyConfigFromEnv,
  loadCodexProxyDevServerConfig,
  loadCodexProxyDevServerConfigFromEnv,
  makeCodexProxyConfig,
} from "./env.js";
export {
  CodexProxyDevServerConfig,
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  CodexProxyMode,
  CodexProxyRuntimeConfig,
} from "./schemas.js";
export type {
  CodexProxyDevServerConfig as CodexProxyDevServerConfigType,
  CodexProxyErrorCode as CodexProxyErrorCodeType,
  CodexProxyErrorResponse as CodexProxyErrorResponseType,
  CodexProxyHealthResponse as CodexProxyHealthResponseType,
  CodexProxyMode as CodexProxyModeType,
  CodexProxyRuntimeConfig as CodexProxyRuntimeConfigType,
} from "./schemas.js";

export const fetch = (request: Request) =>
  codexProxyWebHandler.handler(request);

export default { fetch };
