import { ConfigProvider, Effect, Exit, Layer, Schema } from "effect";

import {
  CodexOAuthProfileCipherConfigLive,
  CodexOAuthProfileCipherLive,
  CodexProfileStoreEncryptedKeyValueLive,
  CodexStoredProfileProofLive,
} from "../src/live.layer.js";
import { CodexStoredProfileProofResult } from "../src/schemas.js";
import { proveCodexStoredProfile } from "../src/stored-profile-proof.service.js";
import {
  CodexSubscriptionLoginConfigLive,
  CodexSubscriptionLoginConfigService,
} from "../src/subscription-login.config.js";
import { UpstashKeyValueStoreLive } from "../src/upstash-key-value-store.layer.js";

declare const process: {
  exitCode: number | undefined;
};

const configProviderLayer = ConfigProvider.layer(ConfigProvider.fromEnv());
const cipherConfigLayer = CodexOAuthProfileCipherConfigLive.pipe(
  Layer.provide(configProviderLayer)
);
const cipherLayer = CodexOAuthProfileCipherLive.pipe(
  Layer.provide(cipherConfigLayer)
);
const profileStoreLayer = CodexProfileStoreEncryptedKeyValueLive.pipe(
  Layer.provideMerge(Layer.merge(cipherLayer, UpstashKeyValueStoreLive))
);
const proofLayer = CodexStoredProfileProofLive.pipe(
  Layer.provideMerge(Layer.merge(profileStoreLayer, UpstashKeyValueStoreLive))
);
const proofConfigLayer = CodexSubscriptionLoginConfigLive.pipe(
  Layer.provide(configProviderLayer)
);

const program = Effect.gen(function* proveStoredProfileCli() {
  const input = yield* CodexSubscriptionLoginConfigService;

  return yield* proveCodexStoredProfile(input.subject);
}).pipe(Effect.provide(Layer.merge(proofLayer, proofConfigLayer)));

const ProofSuccessOutput = Schema.Struct({
  status: Schema.Literal("proved"),
  result: CodexStoredProfileProofResult,
});

const ProofBlockedOutput = Schema.Struct({
  status: Schema.Literal("blocked"),
  message: Schema.NonEmptyString,
});

const encodeProofSuccessOutput = Schema.encodeSync(
  Schema.fromJsonString(ProofSuccessOutput)
);
const encodeProofBlockedOutput = Schema.encodeSync(
  Schema.fromJsonString(ProofBlockedOutput)
);

const exit = await Effect.runPromiseExit(program);

if (Exit.isSuccess(exit)) {
  console.log(
    encodeProofSuccessOutput({ status: "proved", result: exit.value })
  );
} else {
  console.error(
    encodeProofBlockedOutput({
      status: "blocked",
      message:
        "Stored Codex profile proof did not complete. No storage key, subject hash, revision, timestamp, ciphertext, credential, account identifier, claim, or raw payload was printed.",
    })
  );
  process.exitCode = 1;
}
