import { createHash } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { Console, Effect, Option, Schema } from "effect";

import {
  auditVerification,
  boundedVerificationFindings,
  CriticalJourneysJson,
  EvidenceIndexJson,
  JourneyCommandMapJson,
  ProofPacketJson,
  VerificationPolicyReportJson,
} from "./verification-policy.js";
import type {
  DetailArtifact,
  VerificationPolicyReport,
} from "./verification-policy.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const detailPath = "tmp/verification-policy-report.json";
const maximumConsoleFindings = 20;

class VerificationAuditError extends Schema.TaggedErrorClass<VerificationAuditError>()(
  "VerificationAuditError",
  {
    detail: Schema.NonEmptyString,
    operation: Schema.Literals([
      "discover",
      "read",
      "decode",
      "encode",
      "write",
    ]),
    target: Schema.NonEmptyString,
  }
) {}

const requiredFiles = {
  commandMap: "docs/verification/journey-command-map.json",
  evidenceIndex: "docs/verification/evidence-index.json",
  journeys: "docs/verification/critical-journeys.json",
} as const;

const discoverPaths = Effect.fn("VerificationAudit.discoverPaths")(() =>
  Effect.tryPromise({
    try: async () => {
      const process = Bun.spawn(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        { cwd: repositoryRoot, stderr: "pipe", stdout: "pipe" }
      );
      const [stdout, stderr, exitCode] = await Promise.all([
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
        process.exited,
      ]);
      if (exitCode !== 0) {
        throw new Error(stderr || `git ls-files exited ${exitCode}`);
      }
      return stdout.split("\0").filter(Boolean).toSorted();
    },
    catch: (cause) =>
      new VerificationAuditError({
        detail: String(cause),
        operation: "discover",
        target: repositoryRoot,
      }),
  })
);

const readFile = Effect.fn("VerificationAudit.readFile")((path: string) =>
  Effect.tryPromise({
    try: () => Bun.file(resolve(repositoryRoot, path)).text(),
    catch: (cause) =>
      new VerificationAuditError({
        detail: String(cause),
        operation: "read",
        target: path,
      }),
  })
);

const decodeJourneys = (content: string) =>
  Schema.decodeUnknownEffect(CriticalJourneysJson)(content, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      (cause) =>
        new VerificationAuditError({
          detail: String(cause),
          operation: "decode",
          target: requiredFiles.journeys,
        })
    )
  );

const decodeCommandMap = (content: string) =>
  Schema.decodeUnknownEffect(JourneyCommandMapJson)(content, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      (cause) =>
        new VerificationAuditError({
          detail: String(cause),
          operation: "decode",
          target: requiredFiles.commandMap,
        })
    )
  );

const decodeEvidenceIndex = (content: string) =>
  Schema.decodeUnknownEffect(EvidenceIndexJson)(content, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      () =>
        new VerificationAuditError({
          detail: "Verification evidence index is invalid.",
          operation: "decode",
          target: requiredFiles.evidenceIndex,
        })
    )
  );

const decodePacket = (path: string, content: string) =>
  Schema.decodeUnknownEffect(ProofPacketJson)(content, {
    onExcessProperty: "error",
  }).pipe(
    Effect.mapError(
      (cause) =>
        new VerificationAuditError({
          detail: String(cause),
          operation: "decode",
          target: path,
        })
    )
  );

const program = Effect.gen(function* () {
  const discovered = yield* discoverPaths();
  const repositoryPaths = discovered;
  for (const path of Object.values(requiredFiles)) {
    if (!repositoryPaths.includes(path)) {
      return yield* new VerificationAuditError({
        detail:
          "Required verification input is missing from the repository path set.",
        operation: "read",
        target: path,
      });
    }
  }
  const [journeysContent, commandMapContent, evidenceIndexContent] =
    yield* Effect.all([
      readFile(requiredFiles.journeys),
      readFile(requiredFiles.commandMap),
      readFile(requiredFiles.evidenceIndex),
    ]);
  const [journeys, commandMap] = yield* Effect.all([
    decodeJourneys(journeysContent),
    decodeCommandMap(commandMapContent),
    decodeEvidenceIndex(evidenceIndexContent),
  ]);
  const packetPaths = repositoryPaths.filter((path) =>
    /^docs\/evidence\/verification\/packets\/[^/]+\.json$/.test(path)
  );
  const packets = yield* Effect.all(
    packetPaths.map((path) =>
      readFile(path).pipe(
        Effect.flatMap((content) => decodePacket(path, content))
      )
    )
  );
  const detailPaths = [
    ...new Set(
      packets.flatMap((packet) => [
        packet.commandReceipt.detailPath,
        ...packet.evidence.map((item) => item.path),
      ])
    ),
  ].filter(
    (path) =>
      path.startsWith("docs/evidence/") && repositoryPaths.includes(path)
  );
  const detailArtifacts = yield* Effect.all(
    detailPaths.map((path) =>
      readFile(path).pipe(
        Effect.map((content): DetailArtifact => {
          const validJson = Option.isSome(
            Schema.decodeUnknownOption(Schema.UnknownFromJsonString)(content)
          );
          return {
            path,
            sha256: createHash("sha256").update(content).digest("hex"),
            sizeBytes: Buffer.byteLength(content, "utf-8"),
            validJson,
          };
        })
      )
    )
  );
  const report = auditVerification(
    { commandMap, detailArtifacts, journeys, packets, repositoryPaths },
    {
      detailPath,
      generatedAt: new Date().toISOString(),
      maxFindings: maximumConsoleFindings,
    }
  );
  const encoded = yield* Schema.encodeEffect(VerificationPolicyReportJson)(
    report
  ).pipe(
    Effect.mapError(
      (cause) =>
        new VerificationAuditError({
          detail: String(cause),
          operation: "encode",
          target: detailPath,
        })
    )
  );
  const absoluteDetailPath = resolve(repositoryRoot, detailPath);
  yield* Effect.tryPromise({
    try: async () => {
      await mkdir(dirname(absoluteDetailPath), { recursive: true });
      await Bun.write(absoluteDetailPath, `${encoded}\n`);
    },
    catch: (cause) =>
      new VerificationAuditError({
        detail: String(cause),
        operation: "write",
        target: detailPath,
      }),
  });
  if (report.ok) {
    yield* Console.log(
      `check:verification passed: ${journeys.length} journeys; receipt ${detailPath}`
    );
    return yield* Effect.void;
  }
  yield* Console.error(
    `check:verification failed: ${report.findings.length} invariant violation(s)`
  );
  for (const issue of boundedVerificationFindings(report)) {
    yield* Console.error(
      `[${issue.code}] ${issue.invariant}\n  target: ${issue.target}\n  repair: ${issue.repairHint}\n  detail: ${issue.detail}\n  postcondition: ${issue.postcondition}`
    );
  }
  yield* Console.error(
    report.omittedFindings > 0
      ? `${report.omittedFindings} finding(s) omitted; full detail: ${detailPath}`
      : `full detail: ${detailPath}`
  );
  return yield* new VerificationAuditError({
    detail: `${report.findings.length} invariant violation(s)`,
    operation: "write",
    target: detailPath,
  });
});

try {
  await Effect.runPromise(program);
} catch {
  const fallback: VerificationPolicyReport = {
    detailPath,
    findings: [],
    generatedAt: new Date().toISOString(),
    ok: false,
    omittedFindings: 0,
    schemaVersion: 1,
    shownFindings: 0,
  };
  await Effect.runPromise(
    Schema.encodeEffect(VerificationPolicyReportJson)(fallback).pipe(
      Effect.flatMap((encoded) =>
        Effect.tryPromise({
          try: async () => {
            const path = resolve(repositoryRoot, detailPath);
            await mkdir(dirname(path), { recursive: true });
            await Bun.write(path, `${encoded}\n`);
          },
          catch: () => null,
        })
      ),
      Effect.catch(() => Effect.void)
    )
  );
  console.error(
    "check:verification failed; inspect tmp/verification-policy-report.json"
  );
  process.exitCode = 1;
}
