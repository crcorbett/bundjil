import { assert, it } from "@effect/vitest";
import { Ajv2020 } from "ajv/dist/2020.js";
import { Effect, Exit, Schema } from "effect";

import boundedReceiptContract from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import { decodeSyntheticFixture } from "../src/__testing__/fixtures.js";
import {
  AdoptionManifest,
  AdoptionManifestJson,
  InfrastructureArtifactDigest,
  InfrastructureBoundedReceipt,
  InfrastructureBoundedReceiptJson,
  SecretOwnership,
  SyntheticResourceProps,
} from "../src/index.js";

it.effect("round trips foundational props and adoption JSON", () =>
  Effect.gen(function* testFoundationalCodecRoundTrips() {
    const { props, manifest } = yield* decodeSyntheticFixture;
    const encodedProps = yield* Schema.encodeEffect(SyntheticResourceProps)(
      props
    );
    const decodedProps = yield* Schema.decodeEffect(SyntheticResourceProps)(
      encodedProps
    );
    assert.deepStrictEqual(decodedProps, props);

    const secretOwnership = SecretOwnership.make({
      _tag: "ObservedUnknown",
      configured: true,
    });
    const encodedSecretOwnership =
      yield* Schema.encodeEffect(SecretOwnership)(secretOwnership);
    const decodedSecretOwnership = yield* Schema.decodeEffect(SecretOwnership)(
      encodedSecretOwnership
    );
    assert.deepStrictEqual(decodedSecretOwnership, secretOwnership);

    const encodedManifest =
      yield* Schema.encodeEffect(AdoptionManifestJson)(manifest);
    const decodedManifest =
      yield* Schema.decodeEffect(AdoptionManifestJson)(encodedManifest);
    assert.deepStrictEqual(decodedManifest, manifest);

    const malformed = yield* Schema.decodeUnknownEffect(AdoptionManifest)({
      ...manifest,
      digest: "not-a-sha256",
    }).pipe(Effect.exit);
    assert.strictEqual(Exit.isFailure(malformed), true);
  })
);

it.effect(
  "encodes a bounded receipt accepted by the fixed harness contract",
  () =>
    Effect.gen(function* testBoundedReceiptCompatibility() {
      const artifactDigest = yield* Schema.decodeUnknownEffect(
        InfrastructureArtifactDigest
      )("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
      const receipt = InfrastructureBoundedReceipt.make({
        schemaVersion: "1",
        status: "passed",
        claim: "Offline synthetic provider lifecycle is deterministic.",
        target: "BundjilInfrastructure preview synthetic resource",
        candidateIdentity: "local-source-candidate",
        actor: "repository-local test",
        authorityReceipt: "local repository writes only",
        environment: "local ignored Alchemy state",
        journeyIds: [],
        observations: ["Provider lifecycle and native sync completed."],
        postconditions: ["No external provider operation occurred."],
        detailArtifacts: [
          {
            path: "tmp/infrastructure/offline-receipt.json",
            sha256: artifactDigest,
          },
        ],
        limitations: ["Memory provider results are repository proof only."],
        nonClaims: [
          "No Vercel, Photon, deployment, Preview, or Production state was proved.",
        ],
        rollbackOrRecovery:
          "Remove ignored local state and revert the exact source commit.",
        observedAt: "2026-07-24T17:00:00.000Z",
      });
      const encoded = yield* Schema.encodeEffect(InfrastructureBoundedReceipt)(
        receipt
      );
      const validate = new Ajv2020({
        strict: false,
        validateFormats: false,
      }).compile(boundedReceiptContract);
      assert.strictEqual(validate(encoded), true);

      const json = yield* Schema.encodeEffect(InfrastructureBoundedReceiptJson)(
        receipt
      );
      assert.strictEqual(json.includes("provider-secret-sentinel"), false);
      assert.strictEqual(json.includes("phone-number-sentinel"), false);
      const decoded = yield* Schema.decodeEffect(
        InfrastructureBoundedReceiptJson
      )(json);
      assert.deepStrictEqual(decoded, receipt);
    })
);
