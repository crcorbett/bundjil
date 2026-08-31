import { codexProxyWebHandler } from "./server.js";

export {
  CodexProxyAppLive,
  CodexProxyRoutesLive,
  codexProxyWebHandler,
  buildCodexProxyAppLayer,
  createCodexProxyWebHandler,
} from "./server.js";
export {
  CodexProxyOpenAICompatibleProxyLive,
  CodexProxyOpenAICompatibleProxyLiveOrUnavailable,
  CodexProxyOpenAICompatibleProxyUnavailableLive,
} from "./live.layer.js";
export {
  CodexProxyOpenAICompatibleProxyLocalUnavailableLive,
  buildCodexProxyOpenAICompatibleProxyLocal,
} from "./local.layer.js";
export {
  CodexProxyConfig,
  CodexProxyConfigLayer,
  CodexProxyConfigLive,
  decodeCodexProxyConfig,
  loadCodexProxyConfig,
  loadCodexProxyConfigFromEnv,
  loadCodexProxyDevServerConfig,
  loadCodexProxyDevServerConfigFromEnv,
} from "./env.js";
export {
  CodexProxyDevServerConfig,
  CodexProxyErrorCode,
  CodexProxyErrorResponse,
  CodexProxyHealthResponse,
  CodexProxyHealthService,
  CodexProxyLocalProfileStoreDirectory,
  CodexProxyMode,
  CodexProxyRuntimeConfig,
} from "./schemas.js";
export {
  CodexProxyReadiness,
  CodexProxyReadyLive,
  CodexProxyUnavailableLive,
} from "./readiness.service.js";
export {
  CodexProxyProfileCipherConfigLive,
  makeCodexProxyProfileCipherConfigLayer,
} from "./proof-cipher-config.layer.js";
export type {
  CodexProxyDevServerConfig as CodexProxyDevServerConfigType,
  CodexProxyErrorCode as CodexProxyErrorCodeType,
  CodexProxyErrorResponse as CodexProxyErrorResponseType,
  CodexProxyHealthResponse as CodexProxyHealthResponseType,
  CodexProxyHealthService as CodexProxyHealthServiceType,
  CodexProxyLocalProfileStoreDirectory as CodexProxyLocalProfileStoreDirectoryType,
  CodexProxyMode as CodexProxyModeType,
  CodexProxyRuntimeConfig as CodexProxyRuntimeConfigType,
} from "./schemas.js";
export {
  fetchCodexProxyVercelRequest,
  toCodexProxyVercelRequest,
} from "./vercel.js";

export const fetch = (request: Request) =>
  codexProxyWebHandler.handler(request);

export default { fetch };
