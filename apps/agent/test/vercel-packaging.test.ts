import { readFile } from "node:fs/promises";

import { Schema } from "effect";
import { describe, expect, it } from "vitest";

const appDirectory = new URL("..", import.meta.url);
const VercelConfig = Schema.Struct({
  buildCommand: Schema.Literal(
    "cd ../.. && bun run build --filter=@bundjil/agent"
  ),
});

describe("Vercel packaging", () => {
  it("runs the root filtered Turbo build so workspace output precedes Eve build", async () => {
    const config = Schema.decodeUnknownSync(
      Schema.fromJsonString(VercelConfig)
    )(await readFile(new URL("vercel.json", appDirectory), "utf-8"));

    expect(config.buildCommand).toBe(
      "cd ../.. && bun run build --filter=@bundjil/agent"
    );
  });
});
