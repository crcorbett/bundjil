import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { auditBoundaryProvenance } from "./boundary-audit.js";
import type { BoundaryException } from "./boundary-exceptions.js";

const directories: string[] = [];
const fixture = (source: string) => {
  const cwd = mkdtempSync(join(tmpdir(), "bundjil-boundary-audit-"));
  directories.push(cwd);
  const file = join(cwd, "fixture.ts");
  writeFileSync(file, source);
  return { cwd, file };
};

describe("boundary provenance audit", () => {
  afterEach(() => {
    for (const directory of directories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("accepts decoded public contracts and Effectful codecs", () => {
    const { cwd, file } = fixture(`
      export declare const AccountId: { readonly Type: unique symbol };
      export type AccountId = typeof AccountId.Type;
      export interface Accounts { readonly find: (id: AccountId) => Promise<AccountId>; }
    `);
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toStrictEqual([]);
  });

  it("accepts an imported Schema-derived public contract", () => {
    const { cwd, file } = fixture(`
      import type { AccountId } from "./contract.js";
      export interface Accounts { readonly find: (id: AccountId) => Promise<AccountId>; }
    `);
    writeFileSync(
      join(cwd, "contract.ts"),
      `
        export declare const AccountId: { readonly Type: string & { readonly AccountId: unique symbol } };
        export type AccountId = typeof AccountId.Type;
      `
    );
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toStrictEqual([]);
  });

  it.each([
    [
      "boundary-raw-primitive",
      "export interface Accounts { readonly find: (id: string) => Promise<void>; }",
    ],
    [
      "boundary-raw-primitive",
      "type Raw = string; export interface Accounts { readonly find: (id: Raw) => Promise<void>; }",
    ],
    ["direct-json", "export const decode = () => JSON.parse('{}');"],
    [
      "sync-schema-codec",
      "export const decode = () => Schema.decodeSync(Value);",
    ],
    ["config-primitive", "export const token = Config.redacted('TOKEN');"],
    [
      "raw-fetch",
      "export const request = () => fetch('https://example.test');",
    ],
    [
      "raw-response-text",
      "export const read = (response: Response) => response.text();",
    ],
    [
      "unsafe-boundary-syntax",
      "type AccountId = string & { readonly brand: 'AccountId' }; export const id = value as AccountId;",
    ],
    ["unsafe-boundary-syntax", "export const id = value!;"],
    [
      "inline-string-schema",
      "export const Account = Schema.Struct({ id: Schema.String });",
    ],
    [
      "raw-outbound-write",
      "export const send = () => HttpClientRequest.bodyText('raw');",
    ],
  ])("rejects %s", (rule, source) => {
    const { cwd, file } = fixture(source);
    expect(
      auditBoundaryProvenance({ cwd, files: [file] }).map(
        (diagnostic) => diagnostic.rule
      )
    ).toContain(rule);
  });

  it("reports one semantic diagnostic for one nested raw signature slot", () => {
    const { cwd, file } = fixture(
      "export interface Accounts { readonly find: (ids: readonly string[]) => Promise<void>; }"
    );
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toHaveLength(1);
  });

  it.each([
    [
      "TaggedStruct",
      "export const Account = Schema.TaggedStruct('Account', { id: Schema.String });",
    ],
    [
      "TaggedErrorClass",
      "export class AccountError extends Schema.TaggedErrorClass<AccountError>()('AccountError', { message: Schema.NonEmptyString }) {}",
    ],
  ])("rejects inline string fields in exported Schema.%s", (_name, source) => {
    const { cwd, file } = fixture(source);
    expect(
      auditBoundaryProvenance({ cwd, files: [file] }).map(
        (diagnostic) => diagnostic.rule
      )
    ).toContain("inline-string-schema");
  });

  it("rejects a raw outbound variable and accepts an encoded variable", () => {
    const raw = fixture(`
      const body: string = "raw";
      export const send = () => HttpClientRequest.bodyText(body);
    `);
    expect(
      auditBoundaryProvenance({ cwd: raw.cwd, files: [raw.file] }).map(
        (diagnostic) => diagnostic.rule
      )
    ).toContain("raw-outbound-write");

    const encoded = fixture(`
      export const send = Effect.gen(function* () {
        const body = yield* Schema.encodeEffect(Payload)(value).pipe(Effect.mapError(mapError));
        return HttpClientRequest.bodyText(body);
      });
    `);
    expect(
      auditBoundaryProvenance({ cwd: encoded.cwd, files: [encoded.file] })
    ).toStrictEqual([]);
  });

  it("accepts a framework Schema JSON body API", () => {
    const { cwd, file } = fixture(
      "declare const Account: { readonly Type: unique symbol }; type Account = typeof Account.Type; export const send = (value: Account) => HttpClientRequest.schemaBodyJson(Account)(value);"
    );
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toStrictEqual([]);
  });

  it("inspects the body rather than the optional bodyText content type", () => {
    const { cwd, file } = fixture(`
      export const send = Effect.gen(function* () {
        const body = yield* Schema.encodeEffect(Payload)(value);
        return HttpClientRequest.bodyText(body, "application/json");
      });
    `);
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toStrictEqual([]);
  });

  it("admits one exact exception and rejects it when stale", () => {
    const { cwd, file } = fixture(
      "export const request = () => fetch('https://example.test');"
    );
    const exception: BoundaryException = {
      file: "fixture.ts",
      symbol: "request",
      occurrence: "fetch:https://example.test#1",
      owner: "@bundjil/example",
      boundaryKind: "provider",
      canonicalContract: "ExampleResponse",
      admittedSyntax: "global fetch",
      reason: "Fixture proves exact symbol matching.",
      rule: "raw-fetch",
    };
    expect(
      auditBoundaryProvenance({ cwd, files: [file], exceptions: [exception] })
    ).toStrictEqual([]);
    expect(
      auditBoundaryProvenance({
        cwd,
        files: [file],
        exceptions: [{ ...exception, symbol: "other" }],
      }).some((diagnostic) => diagnostic.message.includes("Stale exception"))
    ).toBeTruthy();
  });

  it("detects typed codec misuse with real Effect Schema sides", () => {
    const cwd = process.cwd();
    const file = join(cwd, "tooling/codec-provenance.fixture.ts");
    const diagnostics = auditBoundaryProvenance({ cwd, files: [file] });
    expect(diagnostics.map((diagnostic) => diagnostic.rule)).toStrictEqual([
      "codec-provenance",
      "codec-provenance",
    ]);
  });

  it("accepts owner-named exported Schema fields", () => {
    const { cwd, file } = fixture(
      "const AccountId = Schema.String; export const Account = Schema.Struct({ id: AccountId });"
    );
    expect(auditBoundaryProvenance({ cwd, files: [file] })).toStrictEqual([]);
  });

  it("does not let one occurrence exception admit another occurrence", () => {
    const { cwd, file } = fixture(
      "export const request = () => [fetch('https://one.test'), fetch('https://two.test')];"
    );
    const exception: BoundaryException = {
      file: "fixture.ts",
      symbol: "request",
      occurrence: "fetch:https://one.test#1",
      owner: "@bundjil/example",
      boundaryKind: "provider",
      canonicalContract: "ExampleResponse",
      admittedSyntax: "global fetch",
      reason: "Fixture proves exact occurrence matching.",
      rule: "raw-fetch",
    };
    expect(
      auditBoundaryProvenance({
        cwd,
        files: [file],
        exceptions: [exception],
      }).map((diagnostic) => diagnostic.occurrence)
    ).toStrictEqual(["fetch:https://two.test#1"]);
  });

  it("rejects duplicate exact exception entries", () => {
    const { cwd, file } = fixture(
      "export const request = () => fetch('https://example.test');"
    );
    const exception: BoundaryException = {
      file: "fixture.ts",
      symbol: "request",
      occurrence: "fetch:https://example.test#1",
      owner: "@bundjil/example",
      boundaryKind: "provider",
      canonicalContract: "ExampleResponse",
      admittedSyntax: "global fetch",
      reason: "Fixture proves duplicate rejection.",
      rule: "raw-fetch",
    };
    expect(
      auditBoundaryProvenance({
        cwd,
        files: [file],
        exceptions: [exception, { ...exception }],
      }).some((diagnostic) => diagnostic.message.includes("Stale exception"))
    ).toBeTruthy();
  });
}, 30_000);
