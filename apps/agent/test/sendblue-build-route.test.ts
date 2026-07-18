import { readFile } from "node:fs/promises";

import { assert } from "@effect/vitest";
import { describe, it } from "vitest";

const outputFile = new URL("../.output/server/index.mjs", import.meta.url);
const eveOutputFile = new URL(
  "../.output/server/_libs/eve.mjs",
  import.meta.url
);

describe("Sendblue build route", () => {
  it("builds the webhook at its public absolute route", async () => {
    const output = await readFile(outputFile, "utf-8");
    const eveOutput = await readFile(eveOutputFile, "utf-8");
    assert.include(output, 'route: "/eve/v1/sendblue/webhook"');
    assert.notInclude(output, 'route: "/webhook"');
    assert.include(eveOutput, "SendblueChannel.transitionTyping");
    assert.include(eveOutput, "setTypingIndicator");
    assert.include(eveOutput, "stateInvalid");
  });
});
