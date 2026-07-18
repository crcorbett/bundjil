import { Schema } from "effect";
import { assert, describe, it } from "vitest";

import {
  CodexAuthTemporarilyUnavailable,
  CodexOAuthOperationError,
  CodexOAuthProfileId,
  CodexOAuthSubjectHash,
  CodexProfileNotFound,
  CodexProfileSchemaError,
  CodexProfileStorageError,
  CodexReauthenticationRequired,
} from "../src/index.js";

const profileId = Schema.decodeUnknownSync(CodexOAuthProfileId)("default");
const subjectHash = Schema.decodeUnknownSync(CodexOAuthSubjectHash)(
  "subject-hash"
);

const selectedErrorFixtures = [
  {
    targetTag: "CodexAuthTemporarilyUnavailable",
    oldTag: "CodexOAuthAuthTemporarilyUnavailable",
    expected: {
      _tag: "CodexAuthTemporarilyUnavailable",
      reason: "network",
      message: "Codex authorization is temporarily unavailable.",
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexAuthTemporarilyUnavailable)(
        new CodexAuthTemporarilyUnavailable({
          reason: "network",
          message: "Codex authorization is temporarily unavailable.",
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexAuthTemporarilyUnavailable)(input),
    is: Schema.is(CodexAuthTemporarilyUnavailable),
  },
  {
    targetTag: "CodexReauthenticationRequired",
    oldTag: "CodexOAuthReauthenticationRequired",
    expected: {
      _tag: "CodexReauthenticationRequired",
      profileId: "default",
      message: "Codex reauthentication is required.",
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexReauthenticationRequired)(
        new CodexReauthenticationRequired({
          profileId,
          message: "Codex reauthentication is required.",
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexReauthenticationRequired)(input),
    is: Schema.is(CodexReauthenticationRequired),
  },
  {
    targetTag: "CodexOAuthOperationError",
    oldTag: "CodexOAuthTokenProviderError",
    expected: {
      _tag: "CodexOAuthOperationError",
      operation: "startLogin",
      message: "Unable to construct Codex credentials.",
      cause: { defect: "fixture" },
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexOAuthOperationError)(
        new CodexOAuthOperationError({
          operation: "startLogin",
          message: "Unable to construct Codex credentials.",
          cause: { defect: "fixture" },
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexOAuthOperationError)(input),
    is: Schema.is(CodexOAuthOperationError),
  },
  {
    targetTag: "CodexProfileNotFound",
    oldTag: "OAuthProfileNotFound",
    expected: {
      _tag: "CodexProfileNotFound",
      profileId: "default",
      subjectHash: "subject-hash",
      message: "Codex profile was not found.",
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexProfileNotFound)(
        new CodexProfileNotFound({
          profileId,
          subjectHash,
          message: "Codex profile was not found.",
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexProfileNotFound)(input),
    is: Schema.is(CodexProfileNotFound),
  },
  {
    targetTag: "CodexProfileSchemaError",
    oldTag: "OAuthProfileSchemaError",
    expected: {
      _tag: "CodexProfileSchemaError",
      boundary: "CodexOAuthProfile",
      message: "Unable to decode Codex profile.",
      cause: { defect: "fixture" },
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexProfileSchemaError)(
        new CodexProfileSchemaError({
          boundary: "CodexOAuthProfile",
          message: "Unable to decode Codex profile.",
          cause: { defect: "fixture" },
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexProfileSchemaError)(input),
    is: Schema.is(CodexProfileSchemaError),
  },
  {
    targetTag: "CodexProfileStorageError",
    oldTag: "OAuthProfileStorageError",
    expected: {
      _tag: "CodexProfileStorageError",
      operation: "getProfile",
      key: "profile-key",
      message: "Unable to read Codex profile.",
      cause: { defect: "fixture" },
    },
    encode: () =>
      Schema.encodeUnknownSync(CodexProfileStorageError)(
        new CodexProfileStorageError({
          operation: "getProfile",
          key: "profile-key",
          message: "Unable to read Codex profile.",
          cause: { defect: "fixture" },
        })
      ),
    decode: (input: unknown) =>
      Schema.decodeUnknownSync(CodexProfileStorageError)(input),
    is: Schema.is(CodexProfileStorageError),
  },
] as const;

describe("selected Codex tagged-error contract migration", () => {
  it.each(selectedErrorFixtures)(
    "$targetTag encodes and decodes only the target tag",
    (fixture) => {
      assert.deepStrictEqual(fixture.encode(), fixture.expected);

      const decoded = fixture.decode(fixture.expected);
      assert.strictEqual(decoded._tag, fixture.targetTag);
      assert.strictEqual(fixture.is(decoded), true);

      const oldEncoded = { ...fixture.expected, _tag: fixture.oldTag };
      assert.strictEqual(fixture.is(oldEncoded), false);
      assert.throws(() => {
        fixture.decode(oldEncoded);
      });
    }
  );
});
