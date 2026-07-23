import { readFile } from "node:fs/promises";

import { assert } from "@effect/vitest";
import { Schema } from "effect";
import { describe, it } from "vitest";

const outputFile = new URL("../.output/server/index.mjs", import.meta.url);
const eveOutputFile = new URL(
  "../.output/server/_libs/eve.mjs",
  import.meta.url
);
const compiledManifestFile = new URL(
  "../.eve/compile/compiled-agent-manifest.json",
  import.meta.url
);
const tracedPackageFile = new URL(
  "../.output/server/package.json",
  import.meta.url
);
const CompiledManifest = Schema.Struct({
  config: Schema.Struct({
    build: Schema.optional(
      Schema.Struct({
        externalDependencies: Schema.optional(Schema.Array(Schema.String)),
      })
    ),
  }),
});
const TracedPackage = Schema.Struct({
  dependencies: Schema.optional(
    Schema.Struct({
      "@grpc/grpc-js": Schema.String,
      "nice-grpc": Schema.String,
      "nice-grpc-common": Schema.String,
    })
  ),
});

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

  it("traces every dynamically resolved Photon gRPC runtime package", async () => {
    const manifest = Schema.decodeUnknownSync(CompiledManifest)(
      JSON.parse(await readFile(compiledManifestFile, "utf-8"))
    );

    assert.deepStrictEqual(manifest.config.build?.externalDependencies, [
      "@bundjil/photon",
      "@grpc/grpc-js",
      "nice-grpc",
      "nice-grpc-common",
    ]);

    const tracedPackage = Schema.decodeUnknownSync(TracedPackage)(
      JSON.parse(await readFile(tracedPackageFile, "utf-8"))
    );
    assert.deepStrictEqual(
      {
        "@grpc/grpc-js": tracedPackage.dependencies?.["@grpc/grpc-js"],
        "nice-grpc": tracedPackage.dependencies?.["nice-grpc"],
        "nice-grpc-common": tracedPackage.dependencies?.["nice-grpc-common"],
      },
      {
        "@grpc/grpc-js": "1.14.4",
        "nice-grpc": "2.1.16",
        "nice-grpc-common": "2.0.3",
      }
    );
  });
});
