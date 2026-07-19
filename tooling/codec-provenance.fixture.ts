import { Schema } from "effect";

const Account = Schema.Struct({ id: Schema.String });
const encoded: (typeof Account)["Encoded"] = { id: "account" };
const decoded: (typeof Account)["Type"] = { id: "account" };
const untrusted: unknown = { id: "account" };

export const typedDecodeMisuse = Schema.decodeUnknownEffect(Account)(encoded);
export const typedEncodeMisuse = Schema.encodeUnknownEffect(Account)(decoded);
export const validUnknownDecode =
  Schema.decodeUnknownEffect(Account)(untrusted);
