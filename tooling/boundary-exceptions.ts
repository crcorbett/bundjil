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
 * Exact external/framework adapter exception registry. Each entry documents an
 * unavoidable third-party constraint; removing or changing the named syntax
 * makes the entry stale and fails check:boundaries.
 */
export const boundaryExceptions = [
  {
    file: "packages/sendblue/src/live.layer.ts",
    symbol: "body",
    occurrence: "request.text#1",
    owner: "@bundjil/sendblue",
    boundaryKind: "http-in",
    canonicalContract: "SendblueWebhookMessage",
    admittedSyntax: "Fetch Request text reader",
    reason:
      "The Sendblue webhook adapter authenticates the exact request header before reading and immediately decoding its bounded JSON body.",
    rule: "raw-response-text",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#1",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "private Upstash SDK method primitives",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "private Upstash SDK method primitives",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/eve/src/schema.ts",
    symbol: "EveSchema",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/eve",
    boundaryKind: "framework",
    canonicalContract: "toEveSchema",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "Eve's Standard Schema bridge requires unknown in its exact framework generic constraint.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/eve/src/schema.ts",
    symbol: "toEveSchema",
    occurrence: "UnknownKeyword:unknown#1",
    owner: "@bundjil/eve",
    boundaryKind: "framework",
    canonicalContract: "toEveSchema",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "Eve's Standard Schema bridge requires unknown in its exact framework generic constraint.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#2",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#3",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#2",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#4",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#3",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#5",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#6",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#4",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#7",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#8",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "StringKeyword:string#9",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
  {
    file: "packages/store/src/upstash-client.internal.ts",
    symbol: "UpstashPersistenceClient",
    occurrence: "UnknownKeyword:unknown#5",
    owner: "@bundjil/store",
    boundaryKind: "persistence",
    canonicalContract: "UpstashPersistenceClient",
    admittedSyntax: "raw primitive in the named external adapter contract",
    reason:
      "The private Upstash SDK facade is the exact third-party boundary; its unknown results are decoded immediately by the owning layer.",
    rule: "boundary-raw-primitive",
  },
] as const satisfies readonly BoundaryException[];
