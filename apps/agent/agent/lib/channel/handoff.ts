import type { EveSessionId } from "@bundjil/eve";
import { Context, Effect, Layer, Redacted, Ref, Schema } from "effect";

import { channelHandoffTimeoutDefault } from "./constants.js";
import { ChannelHandoffObservationError } from "./errors.js";
import {
  ChannelHandoffAcceptance,
  ChannelHandoffAttempt,
  ChannelHandoffObservation,
  ChannelSessionFingerprint,
  ChannelWorkFingerprint,
} from "./schemas.js";
import type {
  ChannelHandoffAcceptance as ChannelHandoffAcceptanceType,
  ChannelHandoffAttempt as ChannelHandoffAttemptType,
  ChannelHandoffExitOutcome,
  ChannelHandoffObservation as ChannelHandoffObservationType,
  ChannelHandoffTimeout,
  ChannelInboundAcceptance,
  ChannelReplayClaim,
  ChannelRoutingSecret,
  ChannelSessionFingerprint as ChannelSessionFingerprintType,
  ChannelSessionSettlement,
  ChannelSessionTerminalOutcome,
} from "./schemas.js";

export interface ChannelHandoffShape {
  readonly acceptanceTimeout: ChannelHandoffTimeout;
  readonly prepared: (
    claim: ChannelReplayClaim
  ) => Effect.Effect<ChannelHandoffAttemptType, ChannelHandoffObservationError>;
  readonly sendStarted: (
    attempt: ChannelHandoffAttemptType
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
  readonly sendAccepted: (
    attempt: ChannelHandoffAttemptType,
    sessionId: EveSessionId
  ) => Effect.Effect<
    ChannelHandoffAcceptanceType,
    ChannelHandoffObservationError
  >;
  readonly sendRejected: (
    attempt: ChannelHandoffAttemptType,
    outcome: "rejected" | "timeout" | "uncertain"
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
  readonly converged: (
    attempt: ChannelHandoffAttemptType,
    result: ChannelInboundAcceptance
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
  readonly fingerprintSession: (
    sessionId: EveSessionId
  ) => Effect.Effect<
    ChannelSessionFingerprintType,
    ChannelHandoffObservationError
  >;
  readonly sessionTerminal: (
    sessionFingerprint: ChannelSessionFingerprintType,
    outcome: ChannelSessionTerminalOutcome,
    settlement: ChannelSessionSettlement
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
  readonly response: (
    attempt: ChannelHandoffAttemptType,
    status: 202 | 503
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
  readonly settled: (
    attempt: ChannelHandoffAttemptType,
    outcome: ChannelHandoffExitOutcome
  ) => Effect.Effect<void, ChannelHandoffObservationError>;
}

export class ChannelHandoff extends Context.Service<
  ChannelHandoff,
  ChannelHandoffShape
>()("@bundjil/agent/ChannelHandoff") {}

const makeLayer = (
  secret: ChannelRoutingSecret,
  acceptanceTimeout: ChannelHandoffTimeout,
  observations?: Ref.Ref<readonly ChannelHandoffObservationType[]>
) =>
  Layer.effect(
    ChannelHandoff,
    Effect.gen(function* makeChannelHandoff() {
      const key = yield* Effect.tryPromise({
        try: () =>
          globalThis.crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(Redacted.value(secret)),
            { hash: "SHA-256", name: "HMAC" },
            false,
            ["sign"]
          ),
        catch: () =>
          new ChannelHandoffObservationError({
            operation: "initialize",
            reason: "unavailable",
          }),
      });

      const fingerprint = Effect.fn("ChannelHandoff.fingerprint")(function* (
        domain: "session" | "work",
        value: string
      ) {
        const signature = yield* Effect.tryPromise({
          try: () =>
            globalThis.crypto.subtle.sign(
              "HMAC",
              key,
              new TextEncoder().encode(`${domain}:v1:${value}`)
            ),
          catch: () =>
            new ChannelHandoffObservationError({
              operation: "fingerprint",
              reason: "unavailable",
            }),
        });
        return Array.from(new Uint8Array(signature), (byte) =>
          byte.toString(16).padStart(2, "0")
        ).join("");
      });

      const emit = Effect.fn("ChannelHandoff.emit")(function* (
        observation: ChannelHandoffObservationType
      ) {
        const encoded = yield* Schema.encodeEffect(ChannelHandoffObservation)(
          observation
        ).pipe(
          Effect.mapError(
            () =>
              new ChannelHandoffObservationError({
                operation: "observe",
                reason: "unavailable",
              })
          )
        );
        if (observations === undefined) {
          yield* Effect.logInfo("ChannelHandoffObservation", encoded);
          return;
        }
        yield* Ref.update(observations, (current) => [...current, observation]);
      });

      const timestamp = Effect.clockWith((clock) => clock.currentTimeMillis);
      const observationBase = Effect.fn("ChannelHandoff.observationBase")(
        function* (attempt: ChannelHandoffAttemptType) {
          const observedAtEpochMilliseconds = yield* timestamp;
          return {
            latencyMilliseconds: Math.max(
              0,
              observedAtEpochMilliseconds - attempt.preparedAtEpochMilliseconds
            ),
            observedAtEpochMilliseconds,
            workFingerprint: attempt.workFingerprint,
          };
        }
      );
      const fingerprintSession = Effect.fn("ChannelHandoff.fingerprintSession")(
        function* (sessionId: EveSessionId) {
          return yield* fingerprint("session", sessionId).pipe(
            Effect.flatMap(Schema.decodeEffect(ChannelSessionFingerprint)),
            Effect.mapError(
              () =>
                new ChannelHandoffObservationError({
                  operation: "fingerprint",
                  reason: "unavailable",
                })
            )
          );
        }
      );

      return ChannelHandoff.of({
        acceptanceTimeout,
        prepared: Effect.fn("ChannelHandoff.prepared")(function* (claim) {
          const workFingerprint = yield* fingerprint("work", claim.key).pipe(
            Effect.flatMap(Schema.decodeEffect(ChannelWorkFingerprint)),
            Effect.mapError(
              () =>
                new ChannelHandoffObservationError({
                  operation: "fingerprint",
                  reason: "unavailable",
                })
            )
          );
          const preparedAtEpochMilliseconds = yield* timestamp;
          const attempt = yield* Schema.decodeEffect(ChannelHandoffAttempt)({
            preparedAtEpochMilliseconds,
            workFingerprint,
          }).pipe(
            Effect.mapError(
              () =>
                new ChannelHandoffObservationError({
                  operation: "observe",
                  reason: "unavailable",
                })
            )
          );
          yield* emit({
            _tag: "Prepared",
            latencyMilliseconds: 0,
            observedAtEpochMilliseconds: preparedAtEpochMilliseconds,
            outcome: "pending",
            workFingerprint,
          });
          return attempt;
        }),
        sendStarted: Effect.fn("ChannelHandoff.sendStarted")(
          function* (attempt) {
            yield* emit({
              _tag: "SendStarted",
              ...(yield* observationBase(attempt)),
              outcome: "pending",
            });
          }
        ),
        sendAccepted: Effect.fn("ChannelHandoff.sendAccepted")(
          function* (attempt, sessionId) {
            const sessionFingerprint = yield* fingerprintSession(sessionId);
            const base = yield* observationBase(attempt);
            yield* emit({
              _tag: "SendAccepted",
              ...base,
              outcome: "accepted",
              sessionFingerprint,
            });
            return yield* Schema.decodeEffect(ChannelHandoffAcceptance)({
              acceptedAtEpochMilliseconds: base.observedAtEpochMilliseconds,
              sessionFingerprint,
              workFingerprint: attempt.workFingerprint,
            }).pipe(
              Effect.mapError(
                () =>
                  new ChannelHandoffObservationError({
                    operation: "observe",
                    reason: "unavailable",
                  })
              )
            );
          }
        ),
        converged: Effect.fn("ChannelHandoff.converged")(
          function* (attempt, result) {
            yield* emit({
              _tag: "Continuity",
              ...(yield* observationBase(attempt)),
              outcome: result._tag,
              sessionFingerprint: result.acceptance.sessionFingerprint,
            });
          }
        ),
        fingerprintSession,
        sessionTerminal: Effect.fn("ChannelHandoff.sessionTerminal")(
          function* (sessionFingerprint, outcome, settlement) {
            yield* emit({
              _tag: "SessionTerminal",
              observedAtEpochMilliseconds: yield* timestamp,
              outcome,
              sessionFingerprint,
              settlement,
            });
          }
        ),
        sendRejected: Effect.fn("ChannelHandoff.sendRejected")(
          function* (attempt, outcome) {
            yield* emit({
              _tag: "SendRejected",
              ...(yield* observationBase(attempt)),
              outcome,
            });
          }
        ),
        response: Effect.fn("ChannelHandoff.response")(
          function* (attempt, status) {
            yield* emit({
              _tag: "Response",
              ...(yield* observationBase(attempt)),
              outcome: status === 202 ? "accepted" : "retryable",
              status,
            });
          }
        ),
        settled: Effect.fn("ChannelHandoff.settled")(
          function* (attempt, outcome) {
            yield* emit({
              _tag: "Exit",
              ...(yield* observationBase(attempt)),
              outcome,
            });
          }
        ),
      });
    })
  );

export const layerLive = (
  secret: ChannelRoutingSecret,
  acceptanceTimeout: ChannelHandoffTimeout
) => makeLayer(secret, acceptanceTimeout);

export const layerMemory = (
  secret: ChannelRoutingSecret,
  observations: Ref.Ref<readonly ChannelHandoffObservationType[]>,
  acceptanceTimeout: ChannelHandoffTimeout = channelHandoffTimeoutDefault
) => makeLayer(secret, acceptanceTimeout, observations);
