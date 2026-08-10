import { createHash } from "node:crypto";

import { assert, it } from "@effect/vitest";
import { ConfigProvider, Effect, Inspectable, Layer, Schema } from "effect";
import { TestClock } from "effect/testing";
import { HttpClient, HttpClientResponse } from "effect/unstable/http";

import {
  CapturePhotonCandidateInventory,
  layerPhotonCandidateInventoryLive,
  layerPhotonCandidateInventoryMemory,
  PhotonCandidateBinding,
  PhotonCandidateInventory,
  PhotonCandidateInventoryManifest,
  PhotonCandidateInventoryMemoryConfig,
  PhotonCandidateInventoryObservedAt,
  PhotonCandidateInventoryReceipt,
  PhotonCandidateObservation,
  PhotonIdentityFingerprint,
} from "../src/candidate-inventory.js";

const sourceProjectId = "ab96fc27-475d-4a52-a52e-bef2d4c66dde";
const previewProjectId = "bb96fc27-475d-4a52-a52e-bef2d4c66dde";
const sourceProjectSecret = "source-project-secret-sentinel";
const previewProjectSecret = "preview-project-secret-sentinel";
const firstPhone = "+14155550199";
const secondPhone = "+14155550299";
const sourceFirstUserId = "10d6d04f-f9fa-4a7b-9c97-37c9c90ce91c";
const sourceSecondUserId = "20d6d04f-f9fa-4a7b-9c97-37c9c90ce91c";
const previewUserId = "30d6d04f-f9fa-4a7b-9c97-37c9c90ce91c";
const inventoryObservationEpochMilliseconds = 1_753_401_600_000;

const fingerprint = (value: string) =>
  PhotonIdentityFingerprint.make(
    createHash("sha256").update(value).digest("hex")
  );

const providerUser = (input: {
  readonly assignedPhoneNumber: string;
  readonly id: string;
  readonly phoneNumber: string;
  readonly projectId: string;
}) => ({
  id: input.id,
  projectId: input.projectId,
  type: "shared",
  firstName: null,
  lastName: null,
  email: null,
  phoneNumber: input.phoneNumber,
  assignedPhoneNumber: input.assignedPhoneNumber,
  meta: null,
  createdAt: "2026-07-25T00:00:00.000Z",
});

const candidateRuntime = (client: HttpClient.HttpClient) =>
  Layer.merge(
    ConfigProvider.layer(
      ConfigProvider.fromEnv({
        env: {
          BUNDJIL_PHOTON_MANAGEMENT_PROJECT_ID: sourceProjectId,
          BUNDJIL_PHOTON_MANAGEMENT_PROJECT_SECRET: sourceProjectSecret,
          BUNDJIL_PHOTON_PREVIEW_PROJECT_ID: previewProjectId,
          BUNDJIL_PHOTON_PREVIEW_PROJECT_SECRET: previewProjectSecret,
        },
      })
    ),
    layerPhotonCandidateInventoryLive.pipe(
      Layer.provide(Layer.succeed(HttpClient.HttpClient, client))
    )
  );

it.effect(
  "captures two matching fingerprint-only manifests and adopts the Preview binding",
  () =>
    Effect.gen(function* () {
      const requests: {
        readonly method: string;
        readonly url: string;
      }[] = [];
      const client = HttpClient.make((request) => {
        requests.push({ method: request.method, url: request.url });
        let body;
        if (!request.url.endsWith("/users/")) {
          body = { succeed: true, data: { available: true } };
        } else if (request.url.includes(sourceProjectId)) {
          body = {
            succeed: true,
            data: {
              total: 2,
              users: [
                providerUser({
                  assignedPhoneNumber: "+14155550177",
                  id: sourceFirstUserId,
                  phoneNumber: firstPhone,
                  projectId: sourceProjectId,
                }),
                providerUser({
                  assignedPhoneNumber: "+14155550277",
                  id: sourceSecondUserId,
                  phoneNumber: secondPhone,
                  projectId: sourceProjectId,
                }),
              ],
            },
          };
        } else {
          body = {
            succeed: true,
            data: {
              total: 1,
              users: [
                providerUser({
                  assignedPhoneNumber: "+14155550377",
                  id: previewUserId,
                  phoneNumber: secondPhone,
                  projectId: previewProjectId,
                }),
              ],
            },
          };
        }
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            request,
            Response.json(body, {
              status: 200,
              headers: { "content-type": "application/json" },
            })
          )
        );
      });

      const selectedCandidateFingerprint = fingerprint(secondPhone);
      yield* TestClock.setTime(inventoryObservationEpochMilliseconds);
      const receipt = yield* Effect.gen(function* () {
        const inventory = yield* PhotonCandidateInventory;
        return yield* inventory.captureCandidateInventory(
          CapturePhotonCandidateInventory.make({
            selectedCandidateFingerprint,
          })
        );
      }).pipe(Effect.provide(candidateRuntime(client)));

      assert.strictEqual(receipt.matching, true);
      assert.strictEqual(receipt.observedAt, "2025-07-25T00:00:00.000Z");
      assert.strictEqual(
        receipt.firstManifestDigest,
        receipt.secondManifestDigest
      );
      assert.strictEqual(
        receipt.selectedCandidateFingerprint,
        selectedCandidateFingerprint
      );
      assert.strictEqual(receipt.manifest.candidates.length, 2);
      const selected = receipt.manifest.candidates.find(
        (candidate) =>
          candidate.candidateFingerprint === selectedCandidateFingerprint
      );
      assert.isNotNull(selected?.previewBinding);
      assert.notStrictEqual(
        selected?.sourceBinding.userFingerprint,
        selected?.previewBinding?.userFingerprint
      );
      assert.strictEqual(requests.length, 8);
      assert.isTrue(requests.every((request) => request.method === "GET"));

      const encoded = yield* Schema.encodeEffect(
        Schema.fromJsonString(PhotonCandidateInventoryReceipt)
      )(receipt);
      for (const forbidden of [
        firstPhone,
        secondPhone,
        sourceProjectSecret,
        previewProjectSecret,
      ]) {
        assert.notInclude(encoded, forbidden);
      }
    })
);

it.effect("returns a safe blocked error for malformed provider input", () =>
  Effect.gen(function* () {
    const client = HttpClient.make((request) =>
      Effect.succeed(
        HttpClientResponse.fromWeb(
          request,
          Response.json(
            {
              succeed: true,
              data: {
                total: 1,
                users: [
                  {
                    phoneNumber: firstPhone,
                    secret: sourceProjectSecret,
                  },
                ],
              },
            },
            {
              status: 200,
              headers: { "content-type": "application/json" },
            }
          )
        )
      )
    );

    const exit = yield* Effect.exit(
      Effect.gen(function* () {
        const inventory = yield* PhotonCandidateInventory;
        return yield* inventory.captureCandidateInventory({
          selectedCandidateFingerprint: fingerprint(secondPhone),
        });
      }).pipe(Effect.provide(candidateRuntime(client)))
    );
    assert.strictEqual(exit._tag, "Failure");
    const rendered = Inspectable.toStringUnknown(exit);
    assert.notInclude(rendered, firstPhone);
    assert.notInclude(rendered, sourceProjectSecret);
    assert.include(rendered, "providerReadFailed");
  })
);

it.effect("memory Layer rejects a cross-candidate selection", () =>
  Effect.gen(function* () {
    const selected = fingerprint(secondPhone);
    const binding = PhotonCandidateBinding.make({
      assignedIdentityFingerprint: fingerprint("+14155550377"),
      projectFingerprint: fingerprint(previewProjectId),
      userFingerprint: fingerprint(previewUserId),
    });
    const manifest = PhotonCandidateInventoryManifest.make({
      candidates: [
        PhotonCandidateObservation.make({
          candidateFingerprint: selected,
          previewAvailable: true,
          previewBinding: binding,
          sourceBinding: PhotonCandidateBinding.make({
            assignedIdentityFingerprint: fingerprint("+14155550277"),
            projectFingerprint: fingerprint(sourceProjectId),
            userFingerprint: fingerprint(sourceSecondUserId),
          }),
        }),
      ],
      previewProjectFingerprint: fingerprint(previewProjectId),
      sourceProjectFingerprint: fingerprint(sourceProjectId),
    });
    const digest = fingerprint("manifest");
    const receipt = PhotonCandidateInventoryReceipt.make({
      firstManifestDigest: digest,
      manifest,
      matching: true,
      observedAt: PhotonCandidateInventoryObservedAt.make(
        "2026-07-25T00:00:00.000Z"
      ),
      secondManifestDigest: digest,
      selectedCandidateFingerprint: selected,
      selectedPreviewBindingPresent: true,
    });
    const error = yield* Effect.gen(function* () {
      const inventory = yield* PhotonCandidateInventory;
      return yield* inventory
        .captureCandidateInventory({
          selectedCandidateFingerprint: fingerprint(firstPhone),
        })
        .pipe(Effect.flip);
    }).pipe(
      Effect.provide(
        layerPhotonCandidateInventoryMemory(
          PhotonCandidateInventoryMemoryConfig.make({ receipt })
        )
      )
    );
    assert.strictEqual(error._tag, "PhotonCandidateInventoryError");
    assert.strictEqual(error.reason, "selectionConflict");
  })
);
