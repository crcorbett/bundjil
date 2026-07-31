import { assert, it } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";

import { ManagedStableEnvironmentStateResource } from "../src/adoption-proof.js";

const managedReference = {
  _tag: "Managed" as const,
  reference: {
    owner: "@bundjil/infrastructure/vercel/preview-photon",
    reference: "env-preview-project-secret",
    revision: "99cf80b88b3c0c6a07239559f517b0a15088ba50",
  },
};
const attributes = {
  stage: "preview" as const,
  teamId: "team-bundjil",
  projectId: "project-agent",
  environmentVariableId: "env-preview-project-secret",
  key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
  type: "sensitive" as const,
  targets: ["preview" as const],
  sensitive: true,
  providerUpdatedAt: 1,
  valueOwnership: managedReference,
  deploymentRequired: true,
  ownership: "Owned" as const,
};
const persistedResource = {
  logicalId: "vercel:environment:agent:preview-project-secret",
  status: "updated" as const,
  props: {
    desired: {
      key: "BUNDJIL_CHANNEL_PHOTON_PROJECT_SECRET",
      type: "sensitive" as const,
      targets: ["preview" as const],
      valueOwnership: managedReference,
    },
  },
  attr: attributes,
};

it.effect("decodes managed Alchemy persisted attributes from attr", () =>
  Effect.gen(function* () {
    const decoded = yield* Schema.decodeUnknownEffect(
      ManagedStableEnvironmentStateResource
    )(persistedResource, { onExcessProperty: "ignore" });

    assert.strictEqual(decoded.attr.deploymentRequired, true);
    assert.strictEqual(decoded.attr.valueOwnership._tag, "Managed");
  })
);

it.effect("rejects an output-only managed-state mirror", () =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(
      Schema.decodeUnknownEffect(ManagedStableEnvironmentStateResource)(
        {
          ...persistedResource,
          attr: undefined,
          output: attributes,
        },
        { onExcessProperty: "ignore" }
      )
    );

    assert.strictEqual(Exit.isFailure(exit), true);
  })
);
