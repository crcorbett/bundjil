import { readFile } from "node:fs/promises";

import { assert } from "@effect/vitest";
import { describe, it } from "vitest";

const outputFile = new URL("../.output/server/index.mjs", import.meta.url);
const eveOutputFile = new URL(
  "../.output/server/_libs/eve.mjs",
  import.meta.url
);

describe("Channel build routes", () => {
  it("builds both webhooks at their public absolute routes", async () => {
    const output = await readFile(outputFile, "utf-8");
    const eveOutput = await readFile(eveOutputFile, "utf-8");
    assert.include(output, 'route: "/eve/v1/sendblue/webhook"');
    assert.include(output, 'route: "/eve/v1/photon/webhook"');
    assert.notInclude(output, 'route: "/webhook"');
    assert.include(eveOutput, "Channel.prepareInbound");
    assert.include(eveOutput, "SendblueTransport.sendMessage");
    assert.include(eveOutput, "PhotonTransport.sendMessage");
    assert.include(eveOutput, "ChannelReplay.claimInbound");
  });
});
