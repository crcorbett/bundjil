import { readFile } from "node:fs/promises";

import { Schema } from "effect";
import { describe, expect, it } from "vitest";

const appDirectory = new URL("..", import.meta.url);
const ProxyManifest = Schema.Struct({
  dependencies: Schema.Record(Schema.String, Schema.String),
});
const VercelConfig = Schema.Struct({ buildCommand: Schema.String });

describe("Vercel packaging", () => {
  it("retains the persistence runtime dependency and builds workspace output in order", async () => {
    const [manifestSource, vercelConfigSource] = await Promise.all([
      readFile(new URL("package.json", appDirectory), "utf-8"),
      readFile(new URL("vercel.json", appDirectory), "utf-8"),
    ]);
    const manifest = Schema.decodeUnknownSync(
      Schema.fromJsonString(ProxyManifest)
    )(manifestSource);
    const vercelConfig = Schema.decodeUnknownSync(
      Schema.fromJsonString(VercelConfig)
    )(vercelConfigSource);

    expect(manifest.dependencies["@bundjil/effect-persistence"]).toBe(
      "workspace:*"
    );
    expect(vercelConfig.buildCommand.split(" && ")).toStrictEqual([
      "bun run --filter @bundjil/effect-persistence build",
      "bun run --filter @bundjil/codex-oauth build",
      "bun run --filter @bundjil/codex-proxy build",
    ]);
  });
});
