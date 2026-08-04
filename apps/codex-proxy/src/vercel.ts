import {
  context,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

import { codexProxyWebHandler } from "./server.js";

const VercelRewritePathSearchParam = "path";
const ModelInvocationHeader = "x-bundjil-codex-proxy-model-invocation";
const ProxyTracer = trace.getTracer("bundjil-codex-proxy");

const traceProxyResponse = (
  response: Response,
  span: ReturnType<typeof ProxyTracer.startSpan>
) => {
  const modelInvocation =
    response.headers.get(ModelInvocationHeader) === "true";

  span.setAttribute("bundjil.codex-proxy.model_invocation", modelInvocation);
  span.setAttribute("http.response.status_code", response.status);
  span.updateName(
    modelInvocation
      ? "bundjil.codex-proxy.model-invocation"
      : "bundjil.codex-proxy.request"
  );

  if (response.body === null) {
    if (modelInvocation) {
      span.setAttribute("bundjil.codex-proxy.sse_completed", false);
    }
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
    return response;
  }

  let completed = false;
  const complete = () => {
    if (completed) {
      return;
    }

    completed = true;
    if (modelInvocation) {
      span.setAttribute("bundjil.codex-proxy.sse_completed", true);
    }
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  };
  const fail = () => {
    if (completed) {
      return;
    }

    completed = true;
    if (modelInvocation) {
      span.setAttribute("bundjil.codex-proxy.sse_completed", false);
    }
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: "The proxy response stream did not complete.",
    });
    span.end();
  };
  const reader = response.body.getReader();
  const body = new ReadableStream<Uint8Array>({
    async cancel() {
      try {
        await reader.cancel();
      } finally {
        fail();
      }
    },
    async pull(controller) {
      try {
        const next = await reader.read();

        if (next.done) {
          complete();
          controller.close();
          return;
        }

        controller.enqueue(next.value);
      } catch {
        fail();
        controller.error(new Error("The proxy response stream failed."));
      }
    },
  });

  return new Response(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  });
};

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

export const fetchCodexProxyVercelRequest = (request: Request) => {
  const parent = propagation.extract(context.active(), request.headers);

  return context.with(parent, async () => {
    const span = ProxyTracer.startSpan("bundjil.codex-proxy.request");

    try {
      return traceProxyResponse(
        await codexProxyWebHandler.handler(toCodexProxyVercelRequest(request)),
        span
      );
    } catch (error) {
      span.setAttribute("bundjil.codex-proxy.sse_completed", false);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: "The proxy request failed.",
      });
      span.end();
      throw error;
    }
  });
};
