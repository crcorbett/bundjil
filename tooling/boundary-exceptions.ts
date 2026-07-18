export type BoundaryKind =
  | "cli"
  | "config"
  | "file"
  | "framework"
  | "http-in"
  | "http-out"
  | "persistence"
  | "provider";

export type BoundaryException = Readonly<{
  file: string;
  symbol: string;
  occurrence: string;
  owner: string;
  boundaryKind: BoundaryKind;
  canonicalContract: string;
  admittedSyntax: string;
  reason: string;
  rule: BoundaryRule;
}>;

export type BoundaryRule =
  | "boundary-raw-primitive"
  | "inline-string-schema"
  | "codec-provenance"
  | "raw-outbound-write"
  | "config-primitive"
  | "direct-json"
  | "raw-fetch"
  | "raw-response-text"
  | "sync-schema-codec"
  | "unsafe-boundary-syntax";

/**
 * Exact temporary admissions for already-classified adapters. These entries
 * are migration work, not a count baseline. Removing or changing the named
 * syntax makes the entry stale and fails check:boundaries.
 */
export const boundaryExceptions = [
  {
    file: "apps/agent/agent/lib/sendblue/channel.service.ts",
    symbol: "body",
    occurrence: "request.text#1",
    owner: "apps/agent",
    boundaryKind: "http-in",
    canonicalContract: "SendblueInboundMessage",
    admittedSyntax: "Fetch Request text reader",
    reason:
      "The Fetch webhook adapter must read the signed body as text before immediately decoding SendblueInboundMessage.",
    rule: "raw-response-text",
  },
  {
    file: "apps/agent/agent/lib/sendblue/session-router.service.ts",
    symbol: "keyedSendblueDigest",
    occurrence: "StringKeyword:string#1",
    owner: "apps/agent",
    boundaryKind: "framework",
    canonicalContract: "SendblueConversationKey",
    admittedSyntax: "Web Crypto encoder input",
    reason:
      "Web Crypto accepts primitive UTF-8 fragments only inside the private HMAC adapter before its digest is decoded as SendblueConversationKey.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#1",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "private Upstash SDK method primitives",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "private Upstash SDK method primitives",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/eve-effect/src/eve/tool-adapter.ts",
    symbol: "EveSchema",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/eve-effect",
    boundaryKind: "framework",
    canonicalContract: "toEveSchema",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "Eve's Standard Schema bridge requires unknown in its exact framework generic constraint.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/eve-effect/src/eve/tool-adapter.ts",
    symbol: "toEveSchema",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/eve-effect",
    boundaryKind: "framework",
    canonicalContract: "toEveSchema",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "Eve's Standard Schema bridge requires unknown in its exact framework generic constraint.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#2",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#3",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#2",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#4",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#3",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#5",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#6",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#4",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#7",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#8",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#9",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/effect-persistence/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#5",
    owner: "@bundjil/effect-persistence",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
] as const satisfies readonly BoundaryException[];
