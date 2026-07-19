import { Console, Effect, Schema } from "effect";

const policyFiles = {
  agents: "AGENTS.md",
  browser: ".agents/skills/agent-browser/SKILL.md",
  buildingComponents: ".agents/skills/building-components/SKILL.md",
  compositionPatterns: ".agents/skills/vercel-composition-patterns/SKILL.md",
  effectPatterns: "docs/architecture/effect-patterns.md",
  implementer: ".agents/skills/prd-implementer/SKILL.md",
  reactPractices: ".agents/skills/vercel-react-best-practices/SKILL.md",
  shadcn: ".agents/skills/shadcn/SKILL.md",
  wrapper: ".agents/skills/effect-client-wrapper/SKILL.md",
  writer: ".agents/skills/prd-writer/SKILL.md",
} as const;

type PolicyFile = (typeof policyFiles)[keyof typeof policyFiles];

const SkillPolicyAuditOperation = Schema.Literals([
  "readPolicyFile",
  "validatePolicy",
]);
const SkillPolicyAuditDiagnostic = Schema.NonEmptyString;

class SkillPolicyAuditError extends Schema.TaggedErrorClass<SkillPolicyAuditError>()(
  "SkillPolicyAuditError",
  {
    operation: SkillPolicyAuditOperation,
    message: SkillPolicyAuditDiagnostic,
  }
) {}

const readPolicyFile = Effect.fn("SkillPolicyAudit.readPolicyFile")(function* (
  path: PolicyFile
) {
  return yield* Effect.tryPromise({
    try: () => Bun.file(new URL(`../${path}`, import.meta.url)).text(),
    catch: () =>
      new SkillPolicyAuditError({
        operation: "readPolicyFile",
        message: `Unable to read ${path}.`,
      }),
  });
});

const requiredPolicy: readonly (readonly [keyof typeof policyFiles, string])[] =
  [
    ["agents", "bun run check:skills"],
    ["agents", "typeof Contract.Type"],
    ["agents", "typeof Contract.Encoded"],
    ["agents", "Config.schema"],
    ["agents", "named operations"],
    ["agents", "live/mock Layers"],
    ["effectPatterns", "typeof Contract.Type"],
    ["effectPatterns", "typeof Contract.Encoded"],
    ["effectPatterns", "Schema.decodeUnknownEffect"],
    ["effectPatterns", "Schema.decodeEffect"],
    ["effectPatterns", "Schema.encodeEffect"],
    ["effectPatterns", "Config.schema"],
    ["effectPatterns", "HttpClient"],
    ["effectPatterns", "Schema.TaggedErrorClass"],
    ["effectPatterns", "Match"],
    ["effectPatterns", "Helper Admission"],
    ["writer", "## Required Impact Ledger"],
    ["writer", ".agents/skills/effect-client-wrapper"],
    ["writer", "typeof Contract.Type"],
    ["writer", "typeof Contract.Encoded"],
    ["writer", "Schema.decodeUnknownEffect"],
    ["writer", "Schema.decodeEffect"],
    ["writer", "Schema.encodeEffect"],
    ["writer", "inbound"],
    ["writer", "outbound"],
    ["implementer", ".agents/skills/effect-client-wrapper"],
    ["implementer", "Change required"],
    ["implementer", "typeof Contract.Type"],
    ["implementer", "typeof Contract.Encoded"],
    ["implementer", "Schema.decodeUnknownEffect"],
    ["implementer", "Schema.decodeEffect"],
    ["implementer", "Schema.encodeEffect"],
    ["implementer", "raw public primitives"],
    ["implementer", "unencoded outward writes"],
    ["implementer", "stale exceptions"],
    ["implementer", "helper sprawl"],
    ["wrapper", "Config.schema"],
    ["wrapper", "ConfigProvider"],
    ["wrapper", "Schema.encodeEffect"],
    ["wrapper", "Schema.decodeUnknownEffect"],
    ["wrapper", "Schema.decodeEffect"],
    ["wrapper", "codec's `Encoded` type, use `Schema.decodeEffect` instead"],
    ["wrapper", "Schema.TaggedErrorClass"],
    ["wrapper", "layerLive"],
    ["wrapper", "layerMock"],
    ["browser", "docs/architecture/frontend-composition.md"],
    ["buildingComponents", "docs/architecture/frontend-composition.md"],
    ["buildingComponents", "primitive -> composite -> layout -> route"],
    ["buildingComponents", "schema-owned URL"],
    ["compositionPatterns", "docs/architecture/frontend-composition.md"],
    ["compositionPatterns", "schema-owned URL"],
    ["reactPractices", "docs/architecture/frontend-composition.md"],
    ["reactPractices", "data-bearing leaves"],
    ["shadcn", "docs/architecture/frontend-composition.md"],
  ];

const forbiddenExamples: readonly (readonly [string, RegExp])[] = [
  ["generic SDK callback field", /\buse\s*:\s*</u],
  ["generic SDK callback invocation", /\.use\s*\(/u],
  ["raw semantic identifier", /\b(?:id|identifier)\s*:\s*string\b/iu],
  [
    "primitive semantic Config",
    /Config\.(?:string|nonEmptyString|redacted)\s*\(/u,
  ],
  ["native-class error branch", /\binstanceof\b/u],
  ["unchecked generic SDK result", /Effect\.Effect<\s*A(?:\s*,|>)/u],
];

const contradictoryPolicy: readonly (readonly [
  keyof typeof policyFiles,
  string,
  RegExp,
])[] = [
  [
    "effectPatterns",
    "synchronous codec example",
    /Schema\.(?:decode|encode)(?:Unknown)?Sync\s*\(/u,
  ],
  [
    "effectPatterns",
    "unknown outbound encoder",
    /Schema\.encodeUnknownEffect/u,
  ],
  ["writer", "unknown outbound encoder", /Schema\.encodeUnknownEffect/u],
  ["implementer", "unknown outbound encoder", /Schema\.encodeUnknownEffect/u],
];

const frontendSkillFiles = [
  "browser",
  "buildingComponents",
  "compositionPatterns",
  "reactPractices",
  "shadcn",
] as const;
const staleSitePolicy =
  /Site Repo|docs\/(?:DESIGN|FRONTEND)\.md|docs\/architecture\/frontend\/|@packages\/ui|WEB_OG_TYPOGRAPHY/u;

const runSkillPolicyAudit = Effect.fn("SkillPolicyAudit.run")(function* () {
  const contents = yield* Effect.all({
    agents: readPolicyFile(policyFiles.agents),
    browser: readPolicyFile(policyFiles.browser),
    buildingComponents: readPolicyFile(policyFiles.buildingComponents),
    compositionPatterns: readPolicyFile(policyFiles.compositionPatterns),
    effectPatterns: readPolicyFile(policyFiles.effectPatterns),
    implementer: readPolicyFile(policyFiles.implementer),
    reactPractices: readPolicyFile(policyFiles.reactPractices),
    shadcn: readPolicyFile(policyFiles.shadcn),
    wrapper: readPolicyFile(policyFiles.wrapper),
    writer: readPolicyFile(policyFiles.writer),
  });
  const findings = requiredPolicy.flatMap(([file, fragment]) =>
    contents[file].includes(fragment)
      ? []
      : [`${policyFiles[file]}: missing required policy fragment ${fragment}`]
  );
  const executableExamples = Array.from(
    contents.wrapper.matchAll(/```(?:ts|typescript)\n([\s\S]*?)```/g),
    (match) => match[1] ?? ""
  ).join("\n");

  for (const [label, pattern] of forbiddenExamples) {
    if (pattern.test(executableExamples)) {
      findings.push(
        `${policyFiles.wrapper}: executable example contains ${label}`
      );
    }
  }

  for (const [file, label, pattern] of contradictoryPolicy) {
    if (pattern.test(contents[file])) {
      findings.push(`${policyFiles[file]}: contains contradictory ${label}`);
    }
  }

  for (const file of frontendSkillFiles) {
    if (staleSitePolicy.test(contents[file])) {
      findings.push(
        `${policyFiles[file]}: contains stale Site-specific frontend policy`
      );
    }
  }

  if (findings.length > 0) {
    return yield* new SkillPolicyAuditError({
      operation: "validatePolicy",
      message: `Skill policy audit failed:\n${findings.join("\n")}`,
    });
  }

  return yield* Console.log(
    `Skill policy audit passed for ${Object.keys(policyFiles).length} instruction surfaces.`
  );
});

if (import.meta.main) {
  await Effect.runPromise(
    runSkillPolicyAudit().pipe(
      Effect.catchTag("SkillPolicyAuditError", (error) =>
        Console.error(error.message).pipe(Effect.andThen(Effect.fail(error)))
      )
    )
  );
}
