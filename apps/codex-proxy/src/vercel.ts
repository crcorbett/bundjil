import { codexProxyWebHandler } from "./server.js";

const VercelRewritePathSearchParam = "path";

export const toCodexProxyVercelRequest = (request: Request) => {
  const url = new URL(request.url);
  const rewrittenPath = url.searchParams.get(VercelRewritePathSearchParam);

  if (rewrittenPath === null) {
    return request;
  }

  url.searchParams.delete(VercelRewritePathSearchParam);
  url.pathname = rewrittenPath.startsWith("/")
    ? rewrittenPath
    : `/${rewrittenPath}`;

  return new Request(url, request);
};

export const fetchCodexProxyVercelRequest = (request: Request) =>
  codexProxyWebHandler.handler(toCodexProxyVercelRequest(request));
