import type { Effect } from "effect";
import { Config, Context, Layer, Schema } from "effect";
import type { ConfigError } from "effect/Config";

export const SyntheticProviderCredential = Schema.Redacted(
  Schema.NonEmptyString
);
export type SyntheticProviderCredential =
  typeof SyntheticProviderCredential.Type;
export type SyntheticProviderCredentialEncoded =
  typeof SyntheticProviderCredential.Encoded;

const syntheticProviderCredentialConfig = Config.schema(
  SyntheticProviderCredential,
  "BUNDJIL_INFRASTRUCTURE_SYNTHETIC_CREDENTIAL"
);

export class SyntheticProviderCredentials extends Context.Service<
  SyntheticProviderCredentials,
  Effect.Effect<SyntheticProviderCredential, ConfigError>
>()("@bundjil/infrastructure/SyntheticProviderCredentials") {}

export const SyntheticProviderCredentialsLive = Layer.succeed(
  SyntheticProviderCredentials,
  syntheticProviderCredentialConfig
);
