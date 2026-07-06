# @bundjil/effect-start

Reusable TanStack Start adapters for Effect HTTP programs.

Use this package when a TanStack Start request middleware needs to run a
`ManagedRuntime`-backed Effect program and either return an Effect HTTP
response or fall through to TanStack `next()`.

The package is framework glue only. Applications provide the runtime, the
Effect program, and any pass-through response policy.

Bundjil may use this package for a future TanStack Start app surface, such as a
web console, webhook receiver, or admin workflow. It should remain independent
of Sendblue, Cloudflare, Eve, Notion, and any other app-specific integration.

```ts
import { makeStartOptionalResponseMiddleware } from "@bundjil/effect-start";

export const middleware = makeStartOptionalResponseMiddleware({
  onPassThroughResponse: (response) => response,
  program,
  runtime,
});
```
