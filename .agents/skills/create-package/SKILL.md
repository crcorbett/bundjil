---
name: create-package
description: Scaffold a new package or app in the site Bun + Turbo monorepo with the correct tsconfig, tsdown build config, exports, vitest configs (unit + integration), .env.example, README, and root registration. Use when adding a new domain, backend, or frontend package, or a new TanStack Start app. Triggers on "create a package", "new @packages/<name>", "add a workspace", "scaffold a package", "new app", or implementing a feature that wants its own package.
---

# Create Package

Scaffold a new workspace in `~/Projects/site` and register it in the root configs.

## Where it goes

| Kind                                                                              | Directory         | Workspace name     | Pattern to copy                         |
| --------------------------------------------------------------------------------- | ----------------- | ------------------ | --------------------------------------- |
| Domain (pure TS, shared by frontend & backend)                                    | `packages/<name>` | `@packages/<name>` | `packages/core`                         |
| Backend (server-only utils consumed by an app's server functions / route loaders) | `packages/<name>` | `@packages/<name>` | `packages/core` (with server-only deps) |
| Frontend (React components / hooks / styles)                                      | `packages/<name>` | `@packages/<name>` | `packages/ui`                           |
| App (full-stack TanStack Start)                                                   | `apps/<name>`     | `<name>`           | `apps/web`                              |

Backend and domain packages share the same scaffold — the difference is intent and dependencies (a backend package may pull in things like `pg`, `drizzle-orm`, `effect`, etc.; a pure-domain package stays free of runtime deps).

## Export boundaries (critical)

The root export path (`.` / `index.ts`) is reserved for **types, schemas, service tags, and errors only** — definitions with no runtime side effects and no environment-specific imports. Everything that has side effects or environment coupling — production layers, test layers, mocks, fixtures — ships from a **distinct subpath**.

| Subpath                       | Contents                                                                                       | Imports allowed                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.`                           | Types, schemas, service tags (`Context.Tag`), error classes, branded types                     | Pure TS / Effect Schema. **No** real SDK clients, DB drivers, fs, network, test fixtures.      |
| `./live`                      | Production `Layer` (real SDK / DB / network)                                                   | Server-only deps (`pg`, `drizzle-orm`, AWS SDKs, secrets) — **never** imported by client code. |
| `./test`                      | Integration-test `Layer` using real deps (sandbox API keys, ephemeral DB)                      | Real deps + test credentials. Excluded from production bundles.                                |
| `./mock`                      | Unit-test mock `Layer` (no real deps)                                                          | Pure Effect / Schema fixtures. Excluded from production bundles.                               |
| `./testing`                   | Re-exports of `./test` + `./mock` + fixtures (test convenience module)                         | Test-only. Excluded from production bundles.                                                   |
| `./schemas`, `./errors`, etc. | Optional explicit subpaths if a consumer wants schemas / errors without pulling the whole root | Same purity rules as `.`                                                                       |

Why this matters:

- **Tree-shaking only works at the module boundary.** If `index.ts` re-exports `./live`, every consumer of _anything_ from the root pulls the live layer's transitive deps into their bundle, even if they never call it. Bundlers can't reliably tree-shake side-effecting modules.
- **Server-only code must stay out of client bundles.** A live layer that imports `pg` or `node:fs` will break or balloon a Vite client bundle if the root export path drags it in.
- **Test code must stay out of every production bundle.** Mock fixtures, sandbox credentials, and integration helpers have no place in production.

The canonical trees and `package.json` exports below implement this. Don't shortcut by re-exporting layers from `index.ts` "for convenience" — the convenience cost is recoverable; the bundle / leak cost isn't.

## Canonical file trees

The trees below show the **full canonical layout** for each workspace kind. Some files are conditional (env vars, integration tests, real-API SDK wrappers); each is called out in Step 1 with "when to add this" guidance.

### Domain / backend package

```
packages/<name>/
├── package.json
├── tsconfig.json                  # extends ../../tsconfig.base.json
├── tsdown.config.ts              # build config: per-file ESM, .d.ts, alias rewrite
├── vitest.config.ts               # unit tests
├── vitest.integration.config.ts   # only if package hits real external APIs
├── .env.example                   # only if package needs env vars (TEST_* prefix for test-only)
├── README.md                      # consumer-facing docs
└── src/
    ├── index.ts                   # ROOT EXPORT: types, schemas, service tags, errors only — no runtime/side-effect code
    ├── service.ts                 # Service tag(s) and operation interfaces (no live wiring)
    ├── client.ts                  # Low-level SDK wrapper tag (no live wiring)
    ├── schemas.ts                 # Effect Schema definitions — source of truth for types
    ├── errors.ts                  # Schema.TaggedError definitions
    ├── live.layer.ts              # SUBPATH ./live — production Layer (real SDK / DB) — never imported from index.ts
    ├── test.layer.ts              # SUBPATH ./test — integration-test Layer (real deps) — never imported from index.ts
    ├── mock.layer.ts              # SUBPATH ./mock — unit-test mock Layer — never imported from index.ts
    ├── testing.ts                 # SUBPATH ./testing — re-exports test.layer + mock.layer + fixtures — never imported from index.ts
    └── __tests__/
        ├── service.test.ts                  # unit tests (mock layer)
        ├── service.integration.test.ts      # integration tests (real API), naming = *.integration.test.ts
        └── fixtures/                        # static test data
```

For pure-utility domain packages, the Effect-pattern files (`service.ts`, `*.layer.ts`, `errors.ts`, `testing.ts`) are unnecessary. Drop them and keep just `index.ts` (or wildcard-only exports of small files).

### Frontend package

```
packages/<name>/
├── package.json                   # adds React + UI catalog deps; exports include "./styles/*.css"
├── tsconfig.json                  # extends ../../tsconfig.base.json with paths "@/*"
├── tsdown.config.ts              # build config: per-file ESM, .d.ts, alias rewrite
├── vitest.config.ts               # also matches *.test.tsx
├── components.json                # shadcn config; needed if installing components via the shadcn CLI
├── README.md
└── src/
    ├── index.ts                   # re-exports the public API
    ├── ui/                        # components — one per file
    │   ├── button.tsx
    │   └── card.tsx
    ├── lib/
    │   └── utils.ts               # cn() helper, etc.
    └── styles/
        └── base.css               # Tailwind layers, theme tokens
```

### App (TanStack Start)

```
apps/<name>/
├── package.json                   # workspace deps (@packages/core, @packages/ui), tanstack/react/nitro
├── tsconfig.json                  # extends ../../tsconfig.base.json, noEmit + composite:false, paths "$/*"
├── vite.config.ts                 # tailwindcss + tanstackStart + viteReact, nitro on `command === "build"`
├── vitest.config.ts
├── components.json                # only if app installs shadcn components directly into its own src/
├── .env.example                   # only if app needs env vars
├── public/                        # favicons, manifest, static assets
├── README.md
└── src/
    ├── router.tsx                 # createRouter
    ├── routeTree.gen.ts           # auto-generated by tanstackStart plugin — do not edit
    ├── routes/                    # file-based routes; params must be valid JS identifiers ($postId, not $post-id)
    ├── components/
    └── utils/
```

## Step 0: Decide the contract

Before scaffolding, lock the boundary:

- Workspace name (`@packages/<name>` or app name)
- Public API surface — what `index.ts` (or subpath modules) will export
- Whether the package needs env vars (→ add `.env.example`)
- Whether the package will be tested against a real external API (→ add `vitest.integration.config.ts` and `*.integration.test.ts` files)
- Whether the package wraps an SDK or provides an Effect service (→ load the `effect-client-wrapper` skill before scaffolding `src/`; the file scaffolds below cover only the shell)
- Catalog deps you'll need; if a new shared dep emerges, add it to the right catalog group in root `package.json`

## Step 1: Scaffold files

### 1a. `package.json`

Domain / backend baseline:

```jsonc
{
  "name": "@packages/<name>",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  // `exports` and `publishConfig.exports` are auto-generated by tsdown on
  // every build (from `tsdown.config.ts`'s `entry`). Don't hand-maintain
  // them — your edits will be overwritten. To add a new public subpath,
  // add the file under src/ and tsdown picks it up next build.
  "scripts": {
    "build": "tsdown",
    "check-types": "tsc --noEmit",
    "test": "vitest run",
    "test:integration": "vitest run --config vitest.integration.config.ts",
  },
  "devDependencies": {
    "tsdown": "^0.21.10",
    "typescript": "catalog:typescript",
  },
}
```

- **`@packages/source` MUST be first** in every auto-generated `import` block (tsdown handles this via the shared `definePackageConfig`). The custom condition is set in `tsconfig.base.json` (`customConditions`) and in apps' Vite/Vitest configs (`resolve.conditions`); first-match wins, so source-resolution beats the built `dist` during dev.
- `"private": true`, `"type": "module"` always.
- Reference shared versions through `catalog:<name>` (`catalog:react`, `catalog:tanstack`, `catalog:typescript`, `catalog:utils`, `catalog:build`, `catalog:ui`, `catalog:effect`). Add new deps to a catalog only if multiple workspaces need them — otherwise put a regular pinned version on this package.
- Use `workspace:*` for internal deps: `"@packages/core": "workspace:*"`.
- **Build with `tsdown`**, type-check with `tsc --noEmit`. tsdown (Rolldown-based) emits per-file ESM that mirrors `src/`, generates `.d.ts` via oxc isolatedDeclarations, **rewrites tsconfig path aliases** (`@/lib/foo` → `../lib/foo`) in the emitted JS, and **auto-manages the `exports` map**. Without alias rewriting you get a duplicate-module bug — dist files would keep `@/lib/...` literals, the consuming bundler would resolve them back to source via the package's tsconfig, and the same logical module would load twice (broken React contexts, broken module singletons). tsdown is ~2× faster than tsc + tsc-alias and ~8× faster for `.d.ts`. There is **no tsc-native option** that rewrites path aliases — TypeScript explicitly does not (microsoft/TypeScript#10866, "Working as Intended").
- The exception: packages whose runtime _requires_ Vite's bundler (anything importing `import.meta.glob`-generated code, e.g. `fumadocs-mdx`'s `.source/`). Those can't ship a dist — see the source-only section below.
- Drop `test:integration` if the package has no integration tests.

#### When dist doesn't make sense — source-only packages

Some packages are fundamentally Vite-only — typically because they import generated files that use `import.meta.glob` (e.g. anything fumadocs-mdx generates under `.source/`). For these, dist would be unusable because the runtime can't evaluate `import.meta.glob`. Ship source instead by pointing both `import` conditions at the `.ts` file and dropping the build:

```jsonc
"exports": {
  ".": {
    "import": {
      "@packages/source": "./src/index.ts",
      "default": "./src/index.ts",
    },
  },
},
"scripts": {
  // Generate any artifacts the package needs at consumer-build time —
  // do NOT run tsc.
  "build": "fumadocs-mdx",
  "check-types": "tsc --noEmit",
}
```

Apps consuming such a package must be able to handle TS imports natively (Vite + Bun do). Document it in the package README so future consumers don't try to publish or import it elsewhere.

#### How tsdown derives subpath exports

tsdown walks `entry` and emits one subpath per file (with the `@packages/source` and `default` conditions wired up). For an Effect-pattern package whose `entry` includes `src/live.layer.ts`, `src/test.layer.ts`, `src/mock.layer.ts`, `src/testing.ts`, `src/schemas.ts`, the auto-generated `exports` looks like:

```jsonc
{
  "./live.layer": {
    "@packages/source": "./src/live.layer.ts",
    "default": "./dist/live.layer.js",
  },
  "./test.layer": {
    "@packages/source": "./src/test.layer.ts",
    "default": "./dist/test.layer.js",
  },
  "./mock.layer": {
    "@packages/source": "./src/mock.layer.ts",
    "default": "./dist/mock.layer.js",
  },
  "./testing": {
    "@packages/source": "./src/testing.ts",
    "default": "./dist/testing.js",
  },
  "./schemas": {
    "@packages/source": "./src/schemas.ts",
    "default": "./dist/schemas.js",
  },
}
```

If you'd rather expose the layers under cleaner subpath names (e.g. `./live` instead of `./live.layer`), rename the file at the source — `src/live.ts` → subpath `./live`. The export name mirrors the source file name minus the extension.

For the **Export boundaries** rule, every layer (live / test / mock) and every test convenience module gets its own file, which becomes its own subpath. The `.` block (auto-generated from `src/index.ts`) stays pure (types, schemas, service tags, errors). Do not re-export any layer module from `index.ts`.

Consumer pattern:

```ts
// Server (production app code) — types from root, live layer from ./live
import { MyService, MyNotFoundError } from "@packages/<name>";
import { MyServiceLive } from "@packages/<name>/live";

// Client / domain code that only needs types — never pulls the live layer
import type { MyEntity } from "@packages/<name>";

// Tests
import { MyServiceMock } from "@packages/<name>/mock";
// or, for the all-in-one convenience module:
import { MyServiceMock, fixtures } from "@packages/<name>/testing";
```

A consumer that imports only `import type { MyEntity } from "@packages/<name>"` must end up with **zero** runtime code from the package in the final bundle. If it doesn't, something has been re-exported from `index.ts` that shouldn't be — fix the boundary.

#### Frontend package additions

Add React / UI catalog deps:

```jsonc
"dependencies": {
  "@base-ui/react": "catalog:ui",
  "class-variance-authority": "catalog:utils",
  "clsx": "catalog:utils",
  "react": "catalog:react",
  "tailwind-merge": "catalog:utils"
},
"devDependencies": {
  "@types/react": "catalog:react",
  "@types/react-dom": "catalog:react",
  "tailwindcss": "catalog:build",
  "typescript": "catalog:typescript"
}
```

CSS files aren't covered by tsdown's auto-generated exports — declare them as a manual entry in your `tsdown.config.ts`'s `extraExports` (or hand-add them to package.json after the build, knowing they survive subsequent rebuilds because tsdown only manages what it generated):

```jsonc
// In package.json — these stay because tsdown only rewrites the entries it owns
"./styles/*.css": "./src/styles/*.css"
```

### 1b. `tsconfig.json`

Domain / backend (pure TS):

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["./src/**/*.ts"],
  "compilerOptions": {
    "strictNullChecks": true
  }
}
```

Frontend (TSX):

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["./src/**/*.ts", "./src/**/*.tsx"],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    },
    "strictNullChecks": true
  }
}
```

`tsconfig.base.json` already provides strict mode, the `@packages/source` custom condition, ES2022 / ESNext / Bundler resolution, JSX, declaration / source maps, composite, and the `@effect/language-service` plugin. Don't redeclare those.

`paths: { "@/*": ["./src/*"] }` is for frontend packages using shadcn-style internal `@/...` imports. Skip it otherwise.

### 1c. `tsdown.config.ts`

Use the canonical shared config at `tsdown.base.ts` (repo root). It encodes every default for `@packages/*` library packages — per-file ESM mirroring `src/`, `.d.ts` via oxc isolatedDeclarations, the auto-generated `exports` map with the `@packages/source` custom condition, `publishConfig.exports` for npm-publish readiness, source maps, neutral platform target. The per-package config only declares its `entry`:

```ts
import { definePackageConfig } from "../../tsdown.base";

export default definePackageConfig({
  entry: ["src/**/*.{ts,tsx}"], // or just `*.ts` for non-React packages
});
```

Test files and fixtures are excluded by default if they live under `__tests__/`. To exclude additional patterns from emit (e.g. `src/test.layer.ts`, `src/mock.layer.ts`), use `entry` negations:

```ts
entry: [
  "src/**/*.{ts,tsx}",
  "!src/**/*.test.{ts,tsx}",
  "!src/**/*.spec.{ts,tsx}",
  "!src/**/__tests__/**",
  "!src/test.layer.ts",
  "!src/mock.layer.ts",
],
```

After every `tsdown` run the package.json `exports` and `publishConfig.exports` fields are rewritten from the entry list — **don't hand-maintain those fields**. Edits will be overwritten on next build. Update the entry list instead.

The package's `tsconfig.json` is the single source of truth for both type-checking (`tsc --noEmit`) and the build (tsdown reads it). No `tsconfig.build.json` needed — that file existed only because tsc couldn't share a config across emit + check (different `customConditions`); tsdown resolves the source condition automatically.

Don't add a tsdown config for apps — apps build via Vite, not tsdown.

### 1d. `vitest.config.ts`

Domain / backend:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["@packages/source"],
  },
  test: {
    globals: false,
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
    environment: "node",
  },
});
```

Frontend (allows `.tsx` tests, JSDOM if rendering components):

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["@packages/source"],
  },
  test: {
    globals: false,
    passWithNoTests: true,
    include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.integration.test.ts"],
    environment: "jsdom", // or "node" if no DOM rendering
  },
});
```

Tests can live in `src/__tests__/` (close to the code they test) or `test/` (separated). Either works; pick one per package and stay consistent.

The root `vitest.config.ts` has `projects: ["packages/*", "apps/*"]`, so a new package is auto-included in `bun run test` from the repo root.

### 1e. `vitest.integration.config.ts` (only when calling real external APIs)

Add this only if the package has integration tests against a real external service. Naming convention: `*.integration.test.ts`, kept out of the unit `vitest.config.ts` via the `exclude` rule above.

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["@packages/source"],
  },
  test: {
    globals: false,
    passWithNoTests: true,
    include: ["src/**/*.integration.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
    environment: "node",
    testTimeout: 120_000, // real APIs are slow
  },
});
```

When integration tests need credentials, load them via `dotenv` in the file (or a global setup file referenced from `test.setupFiles`). Use the `TEST_` prefix for any credential env var so they're clearly distinct from production secrets — `TEST_API_KEY`, `TEST_DATABASE_URL`, etc.

Keep integration tests off the default `bun run test` path. They run via the package-local script:

```bash
bun --cwd packages/<name> run test:integration
```

### 1f. `.env.example` (only if the package needs env vars)

Document every variable the package reads, with placeholder values and an inline comment pointing to where to obtain it:

```bash
# External API
MY_SERVICE_API_KEY="sk-xxxx"                                 # Issued at https://example.com/settings
MY_SERVICE_API_URL="https://api.example.com/v1"              # Base URL

# Test-only (TEST_ prefix distinguishes from production)
TEST_MY_SERVICE_API_KEY="sk-test-xxxx"                       # Sandbox key
```

Rules:

- One variable per line, `KEY="placeholder"` format.
- Inline `#` comment describing the variable and where to obtain it.
- Realistic placeholder formats (`sk-xxxx` for API keys, full URLs for endpoints).
- **Never include real credentials.**
- Test-only variables use `TEST_` prefix.

### 1g. `README.md`

Every package should ship a `README.md` describing what it is, when to use it, and how to consume it. Keep it consumer-focused, not implementation detail.

```markdown
# @packages/<name>

<One-line description.>

## Overview

**What:** <What the package does.>
**Why:** <Why it exists as a separate package.>
**When to use:** <When consumers should depend on it.>

## Examples

\`\`\`ts
import { foo } from "@packages/<name>/foo";
// usage
\`\`\`

## Testing

- `bun run test` — unit tests
- `bun run test:integration` — real-API tests (needs `TEST_*` env vars)

## API

<Brief reference of exported types, services, errors. Or: "See `src/` exports.">
```

### 1h. `src/index.ts` — root export boundary

`index.ts` is reserved for **types, schemas, service tags, and errors only**. No layers, no runtime side effects, no environment-coupled imports. Anything else is a separate subpath.

```ts
/**
 * @packages/<name>
 *
 * <Brief description of the package purpose.>
 */

// Service tags (Context.Tag / Effect.Service class definitions — no Live wiring here)
export { MyService, MyClient } from "./service.ts";
export type { IMyService } from "./service.ts";

// Errors (Schema.TaggedError classes)
export { MyNotFoundError, MyValidationError } from "./errors.ts";

// Schemas + derived types
export { MyEntitySchema } from "./schemas.ts";
export type { MyEntity } from "./schemas.ts";
```

What **never** belongs here:

- ❌ `export * from "./live.layer.ts"` — drags server-only deps into every consumer
- ❌ `export * from "./mock.layer.ts"` — drags test fixtures into production
- ❌ `export * from "./testing.ts"` — same as above
- ❌ Any module that calls a side effect at import time (DB connection, fs read, etc.)
- ❌ Convenience re-exports of layer constructors

Consumers that want a layer import from the matching subpath (`@packages/<name>/live`, `/mock`, `/test`, `/testing`). This keeps the type-only import path zero-runtime and the layer paths server-or-test-only.

For tiny utility packages with no single coherent API, skip `index.ts` and let consumers import via the wildcard subpath (`@packages/<name>/<file>`). The same purity rule applies to whichever file lands at `.` if you do define one.

### 1i. App `vite.config.ts` — dev uses source, build uses dist

Only applies to apps (`apps/<name>/`). Toggle the `@packages/source` resolution condition based on Vite's `command`:

```ts
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => {
  // Use workspace source files in dev for live HMR across @packages/*; in
  // production builds drop the condition so Vite resolves through each
  // package's `default` export to the compiled dist outputs (built first by
  // turbo's ^build dependency).
  const useWorkspaceSource = command !== "build";

  return {
    server: {
      // portless's PORT/HOST land here; see the portless skill for the
      // bun --bun + portless detection caveat.
      port: Number(process.env["PORT"]) || 3000,
      host: process.env["HOST"] || "localhost",
    },
    resolve: {
      ...(useWorkspaceSource ? { conditions: ["@packages/source"] } : {}),
      tsconfigPaths: true,
    },
    ssr: {
      resolve: {
        ...(useWorkspaceSource ? { conditions: ["@packages/source"] } : {}),
      },
    },
    plugins: [
      tailwindcss(),
      tanstackStart({ srcDirectory: "src" }),
      command === "build"
        ? nitro({
            preset: "vercel",
            vercel: { functions: { runtime: "bun1.x" } },
          })
        : null,
      viteReact(),
    ],
  };
});
```

What this gives:

- **Dev (`vite dev`)** — `@packages/source` is added to Vite's resolve conditions for both client and SSR. Workspace package imports resolve to TS source (`./src/*.ts` per the package's exports map). HMR works across workspace boundaries with no build step.
- **Build (`vite build`)** — the condition is dropped. Vite resolves through each package's `default` export to compiled `./dist/src/*.js`. Turbo's `dependsOn: ["^build"]` builds the packages first so the `dist/` outputs exist before the app build starts.

Key details:

- **Use a conditional spread**, not `conditions: useWorkspaceSource ? [...] : undefined`. Vite types `resolve.conditions` as `string[] | undefined` but `ssr.resolve.conditions` as strict `string[]` (no undefined). Spreading the key in/out side-steps the inconsistency for both fields.
- **`tsc --noEmit`** (the type-check half of `bun run build`) keeps using `@packages/source` because `tsconfig.base.json` sets `customConditions: ["@packages/source"]`. This is correct: TS checks against source for accurate types regardless of whether `dist/` exists. Vite's runtime resolution is a separate concern.
- **Vitest configs always keep `@packages/source` in `resolve.conditions`**. Tests should iterate against source for fast loops with no intermediate `tsc` step. This applies to per-app and per-package vitest configs.
- **`tsconfigPaths: true`** is the Vite 8 native replacement for the old `vite-tsconfig-paths` plugin. Picks up the `paths` aliases from the app's `tsconfig.json` (e.g. `$/*` → `./src/*`).

Apps don't need a `tsconfig.build.json` — their `tsc --noEmit` handles type-checking; the build artifact is produced by Vite.

## Step 2: Register in root configs

### Always update: root `tsconfig.json`

The `references` array is explicit, not glob-based. New workspaces aren't type-checked by `turbo run check-types` from the root unless added:

```jsonc
"references": [
  { "path": "./apps/web" },
  { "path": "./apps/<new-app>" },     // alphabetical
  { "path": "./packages/core" },
  { "path": "./packages/<new-pkg>" }, // alphabetical
  { "path": "./packages/ui" }
]
```

### Auto-discovered (no edit needed)

- **Workspaces** — root `package.json` uses globs `apps/*`, `packages/*`. New dirs under either are auto-detected on `bun install`.
- **Vitest** — root `vitest.config.ts` has `projects: ["packages/*", "apps/*"]`.
- **Turbo** — generic task definitions (`build`, `dev`, `check-types`, `test`) apply to every workspace.

### Conditional

- **Catalog entries** — only if a new shared dep is needed by more than one workspace. Add to the right group (`react`, `typescript`, `tanstack`, `build`, `utils`, `ui`).
- **Root `AGENTS.md`** — add a section if the new workspace introduces a non-obvious convention agents need to know about (e.g. a local reference repo, a special test setup).
- **Root `.env.example`** — only if the package's env vars are configured at the repo root (most packages keep their own `.env.example` in their dir).

## Step 3: Install and verify

```bash
bun install                # links the new workspace
bun run check-types        # turbo-driven, hits all workspaces (cached)
bun run test               # vitest projects auto-discovered
bun run build              # for packages: emits to dist/; for apps: builds to .vercel/output/
```

If `tsc` errors with "Cannot find module '@packages/<new-pkg>'", you forgot to add the `references` entry in root `tsconfig.json`, or the importing package's tsconfig doesn't reach the new workspace.

If integration tests apply, run them explicitly (they're excluded from the default `test` path):

```bash
bun --cwd packages/<name> run test:integration
```

## Effect-based packages

If the package wraps an external SDK or provides a service via Effect:

1. Load the `effect-client-wrapper` skill — it covers the `Context.Tag` low-level wrapper, `Effect.Service` higher-level service, `Schema.TaggedError` errors derived from schemas, and `Layer` patterns.
2. Add `effect` from root devDeps as a workspace `dependencies` entry (or a dev dep if it's a test-only utility).
3. The Effect-pattern files in the canonical tree (`service.ts`, `client.ts`, `schemas.ts`, `errors.ts`, `live.layer.ts`, `mock.layer.ts`, `test.layer.ts`, `testing.ts`) only apply when the package adopts that pattern.
4. Use `Effect.fn("PackageName.method")` at the public service boundary for stable spans.

**Layer split is mandatory.** Even within the Effect pattern, the export boundary rule above is non-negotiable:

- `service.ts` defines the service tag and operation interfaces only — no `Layer` construction, no real client wiring.
- `live.layer.ts` constructs the production `Layer` and is reachable only at `./live`.
- `mock.layer.ts` and `test.layer.ts` are reachable only at `./mock` / `./test`.
- `testing.ts` (re-exports for the `./testing` convenience subpath) is reachable only at `./testing`.
- `index.ts` re-exports the service tag, errors, and schemas — never any of the layer modules.

A consumer that types-only-imports from the package root must compile to zero bytes from the package in the final bundle. If a `Layer` ever becomes reachable from `index.ts`, the boundary is broken.

This skill scaffolds the workspace shell. The Effect-specific patterns belong in the `effect-client-wrapper` skill so they stay versioned with Effect itself.

## Checklist

### Files

- [ ] `package.json` — `private: true`, `type: "module"`, exports map with `@packages/source` first in every `import` block, scripts (`build` → `tsdown`, `check-types` → `tsc --noEmit`, `test`, `test:integration` if applicable), catalog deps where shared, `tsdown` in devDeps
- [ ] `tsconfig.json` extending `../../tsconfig.base.json` (no redeclared base settings)
- [ ] `tsdown.config.ts` — `unbundle: true`, `dts: true`, entry covers `src/**/*.{ts,tsx}` minus tests / fixtures / test-only files
- [ ] `vitest.config.ts` — frontend variant if `.tsx` tests, integration tests excluded
- [ ] `vitest.integration.config.ts` (only if package hits real APIs)
- [ ] `.env.example` (only if package reads env vars; `TEST_` prefix for test-only)
- [ ] `README.md` with overview, examples, testing, API
- [ ] Frontend: `components.json` if installing shadcn components, `paths: { "@/*": ["./src/*"] }` in tsconfig, CSS export `"./styles/*.css"`
- [ ] App: `vite.config.ts`, `vitest.config.ts`, `public/`, `src/router.tsx`, `src/routes/`, `noEmit: true` + `composite: false` in tsconfig, no `tsdown.config.ts`

### Source

- [ ] `src/index.ts` — root export contains **only** types, schemas, service tags, and errors. No layer, mock, fixture, or side-effecting module is reachable from `index.ts` (directly or transitively)
- [ ] `live.layer.ts` exported only at `./live` (never re-exported from `index.ts`); server-only deps live here
- [ ] `test.layer.ts` exported only at `./test`; integration-test wiring with real deps
- [ ] `mock.layer.ts` exported only at `./mock`; pure mock with no real deps
- [ ] `testing.ts` exported only at `./testing`; re-exports test/mock layers + fixtures
- [ ] Tree-shake check: a `import type { Foo } from "@packages/<name>"` consumer compiles to **zero** runtime code from the package
- [ ] Effect-based: types derived from `Schema` via `typeof MySchema.Type`, errors use `Schema.TaggedError`, services use `Effect.fn("Service.method")` at public boundary

### Registration

- [ ] Root `tsconfig.json` — `references` entry added (alphabetical)
- [ ] Catalog entries added only if a dep is genuinely shared across workspaces
- [ ] Root `AGENTS.md` updated only if the new workspace introduces conventions agents need to know about

### Verification

- [ ] `bun install` clean
- [ ] `bun run check-types`, `bun run test`, `bun run build` all pass
- [ ] Integration tests run cleanly via `bun --cwd packages/<name> run test:integration` (if applicable)
- [ ] Effect-based: `effect-client-wrapper` skill loaded and applied
