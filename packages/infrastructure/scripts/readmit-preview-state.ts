import { createHash } from "node:crypto";
import { dirname } from "node:path";
/* oxlint-disable max-classes-per-file -- The command keeps authority and host-boundary failures distinct. */
// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- The pinned Alchemy plan exposes an upstream unknown channel.
/** @effect-diagnostics anyUnknownInErrorContext:off, missingEffectContext:off */

import { Ajv2020 } from "ajv/dist/2020.js";
import { AlchemyContextLive } from "alchemy/AlchemyContext";
import * as AlchemyApply from "alchemy/Apply";
import { ArtifactStore, createArtifactStore } from "alchemy/Artifacts";
import { selectCli } from "alchemy/Cli/selectCli";
import * as AlchemyPlan from "alchemy/Plan";
import * as AlchemyStack from "alchemy/Stack";
import { State } from "alchemy/State";
import { PlatformServices } from "alchemy/Util/PlatformServices";
import {
  Config,
  ConfigProvider,
  Console,
  DateTime,
  Effect,
  FileSystem,
  Layer,
  Schema,
} from "effect";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";

import authorityEnvelopeSchema from "../../../.agents/skills/docs-maintainer/assets/harness/authority-envelope.schema.json" with { type: "json" };
import boundedReceiptSchema from "../../../.agents/skills/docs-maintainer/assets/harness/bounded-receipt.schema.json" with { type: "json" };
import { makeStableInfrastructureReadmissionStack } from "../../../alchemy.stable.run.js";
import readmissionAuthorityPolicy from "../schemas/preview-state-readmission-authority.schema.json" with { type: "json" };
import {
  InfrastructureDriftArtifactPath,
  InfrastructureDriftRunIdentity,
  InfrastructureDriftSourceSha,
  InfrastructureStateReadmissionError,
  InfrastructureStateReadmissionLogicalIdsJson,
  InfrastructureStateReadmissionPlan,
  layerAlchemyR2State,
  loadAdoptionCommand,
  validateInfrastructureStateReadmissionConvergence,
  validateInfrastructureStateReadmissionPlan,
  validateStableAdoptionCommand,
} from "../src/index.js";

declare const process: { exitCode: number | undefined };

const StateReadmissionCommandFailureReason = Schema.Literals([
  "authorityInvalid",
  "configurationInvalid",
  "manifestInvalid",
  "receiptInvalid",
  "stateInvalid",
]);
class StateReadmissionCommandError extends Schema.TaggedErrorClass<StateReadmissionCommandError>()(
  "StateReadmissionCommandError",
  { reason: StateReadmissionCommandFailureReason }
) {}

const authorityPathConfig = Config.schema(
  InfrastructureDriftArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_AUTHORITY_PATH"
);
const receiptPathConfig = Config.schema(
  InfrastructureDriftArtifactPath,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_RECEIPT_PATH"
);
const sourceShaConfig = Config.schema(
  InfrastructureDriftSourceSha,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_SOURCE_SHA"
);
const runIdentityConfig = Config.schema(
  InfrastructureDriftRunIdentity,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_RUN_IDENTITY"
);
const logicalIdsConfig = Config.schema(
  InfrastructureStateReadmissionLogicalIdsJson,
  "BUNDJIL_INFRASTRUCTURE_READMISSION_LOGICAL_IDS_JSON"
);

const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

const readAuthority = Effect.fn("StateReadmissionAuthority.read")(function* (
  path: typeof InfrastructureDriftArtifactPath.Type
) {
  const fileSystem = yield* FileSystem.FileSystem;
  const metadata = yield* fileSystem.stat(path);
  if (metadata.mode % 0o1000 !== 0o600 || metadata.size > 64n * 1024n) {
    return yield* new StateReadmissionCommandError({
      reason: "authorityInvalid",
    });
  }
  const text = yield* fileSystem.readFileString(path);
  const authority = yield* Schema.decodeUnknownEffect(
    Schema.fromJsonString(Schema.Unknown)
  )(text).pipe(
    Effect.mapError(
      () => new StateReadmissionCommandError({ reason: "authorityInvalid" })
    )
  );
  const options = { allErrors: true, strict: false } as const;
  if (
    !new Ajv2020(options).compile(authorityEnvelopeSchema)(authority) ||
    !new Ajv2020(options).compile(readmissionAuthorityPolicy)(authority)
  ) {
    return yield* new StateReadmissionCommandError({
      reason: "authorityInvalid",
    });
  }
  return sha256(text);
});

const readConfiguration = Effect.gen(function* () {
  const logicalIds = yield* logicalIdsConfig;
  return {
    authorityPath: yield* authorityPathConfig,
    logicalIds,
    receiptPath: yield* receiptPathConfig,
    runIdentity: yield* runIdentityConfig,
    sourceSha: yield* sourceShaConfig,
  };
}).pipe(
  Effect.mapError(
    () => new StateReadmissionCommandError({ reason: "configurationInvalid" })
  )
);

const persistReceipt = Effect.fn("StateReadmissionReceipt.persist")(function* (
  input: {
    readonly authorityFingerprint: string;
    readonly candidateIdentity: string;
    readonly receiptPath: typeof InfrastructureDriftArtifactPath.Type;
    readonly runIdentity: string;
    readonly sourceSha: string;
  },
  before: {
    readonly update: number;
    readonly noOp: number;
    readonly resourceCount: number;
  },
  after: { readonly noOp: number; readonly resourceCount: number }
) {
  const observedAt = yield* DateTime.now;
  const receipt = {
    schemaVersion: "1",
    status: "passed",
    claim:
      "The exact Preview Alchemy state metadata refresh was applied and the next plan was unchanged.",
    target: "alchemy:BundjilInfrastructure:preview",
    candidateIdentity: `${input.candidateIdentity}:${input.sourceSha}`,
    actor: input.runIdentity,
    authorityReceipt: input.authorityFingerprint,
    environment: "preview",
    journeyIds: ["BND-J14-preview-infrastructure-drift-report"],
    observations: [
      `approved plan: ${before.update} updates, ${before.noOp} unchanged, ${before.resourceCount} total`,
      `following plan: ${after.noOp} unchanged, ${after.resourceCount} total`,
      "provider mutation services were denied by the composed Layer",
    ],
    postconditions: [
      "the same reviewed in-memory plan was applied",
      "the following plan contained only unchanged resources",
    ],
    detailArtifacts: [],
    limitations: [
      "This receipt proves Alchemy state convergence only; independent provider readback remains separate.",
    ],
    nonClaims: [
      "No provider credential value or write-only environment value was read.",
      "No deployment, Production result or public behaviour is claimed.",
    ],
    rollbackOrRecovery:
      "Stop further mutation and re-run the approved exact-manifest plan under fresh authority if state readback contradicts this receipt.",
    observedAt: DateTime.formatIso(observedAt),
  };
  const validate = new Ajv2020({
    allErrors: true,
    strict: false,
    validateFormats: false,
  }).compile(boundedReceiptSchema);
  if (!validate(receipt)) {
    return yield* new StateReadmissionCommandError({
      reason: "receiptInvalid",
    });
  }
  const text = yield* Schema.encodeEffect(
    Schema.fromJsonString(Schema.Unknown)
  )(receipt).pipe(
    Effect.mapError(
      () => new StateReadmissionCommandError({ reason: "receiptInvalid" })
    )
  );
  const fileSystem = yield* FileSystem.FileSystem;
  yield* fileSystem.makeDirectory(dirname(input.receiptPath), {
    recursive: true,
    mode: 0o700,
  });
  yield* fileSystem.writeFileString(input.receiptPath, text, { mode: 0o600 });
  yield* fileSystem.chmod(input.receiptPath, 0o600);
  return { receiptPath: input.receiptPath, status: "passed" as const };
});

const program = Effect.gen(function* () {
  const configuration = yield* readConfiguration;
  const authorityFingerprint = yield* readAuthority(
    configuration.authorityPath
  );
  const loaded = yield* loadAdoptionCommand.pipe(
    Effect.mapError(
      () => new StateReadmissionCommandError({ reason: "manifestInvalid" })
    )
  );
  if (loaded.input.stage !== "preview" || loaded.input.mode !== "apply") {
    return yield* new StateReadmissionCommandError({
      reason: "manifestInvalid",
    });
  }
  const manifest = yield* validateStableAdoptionCommand(loaded).pipe(
    Effect.mapError(
      () => new StateReadmissionCommandError({ reason: "manifestInvalid" })
    )
  );
  const summaries = yield* AlchemyStack.evalStack(
    makeStableInfrastructureReadmissionStack(manifest),
    (stack) =>
      Effect.gen(function* () {
        const plan = yield* AlchemyPlan.make(stack);
        const decodedPlan = yield* Schema.decodeUnknownEffect(
          InfrastructureStateReadmissionPlan
        )(plan).pipe(
          Effect.mapError(
            () =>
              new InfrastructureStateReadmissionError({
                reason: "planInvalid",
              })
          )
        );
        const before = yield* validateInfrastructureStateReadmissionPlan(
          manifest,
          configuration.logicalIds,
          decodedPlan
        );
        yield* AlchemyApply.apply(plan);
        const afterPlan = yield* AlchemyPlan.make(stack);
        const decodedAfterPlan = yield* Schema.decodeUnknownEffect(
          InfrastructureStateReadmissionPlan
        )(afterPlan).pipe(
          Effect.mapError(
            () =>
              new InfrastructureStateReadmissionError({
                reason: "planInvalid",
              })
          )
        );
        const after =
          yield* validateInfrastructureStateReadmissionConvergence(
            decodedAfterPlan
          );
        return { after, before };
      }),
    { stage: "preview" }
  ).pipe(
    Effect.mapError((error) =>
      Schema.is(InfrastructureStateReadmissionError)(error)
        ? error
        : new StateReadmissionCommandError({ reason: "stateInvalid" })
    )
  );
  return yield* persistReceipt(
    {
      authorityFingerprint,
      candidateIdentity: manifest.digest,
      receiptPath: configuration.receiptPath,
      runIdentity: configuration.runIdentity,
      sourceSha: configuration.sourceSha,
    },
    summaries.before,
    summaries.after
  );
});

const stateLayer = layerAlchemyR2State.pipe(
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then, eslint-plugin-promise/prefer-await-to-callbacks -- Layer.catch recovers the typed Layer error channel. */
  Layer.catch(() =>
    Layer.effect(
      State,
      new StateReadmissionCommandError({ reason: "stateInvalid" })
    )
  )
);
const runtime = Layer.mergeAll(
  PlatformServices,
  FetchHttpClient.layer,
  Layer.provideMerge(AlchemyContextLive, PlatformServices),
  Layer.succeed(ArtifactStore, createArtifactStore()),
  selectCli(),
  stateLayer,
  ConfigProvider.layer(ConfigProvider.fromEnv())
);

const main = program.pipe(
  Effect.provide(runtime),
  Effect.flatMap(Console.log),
  /* oxlint-disable-next-line eslint-plugin-promise/prefer-await-to-then -- Effect.catch handles the typed command error channel, not a Promise. */
  Effect.catch(() =>
    Console.error('{"status":"blocked"}').pipe(
      Effect.andThen(
        Effect.sync(() => {
          process.exitCode = 1;
        })
      )
    )
  )
);

await Effect.runPromise(main);
