import { Effect, Schema } from "effect";

export const BundjilWorkspaceName = Schema.NonEmptyString.pipe(
  Schema.brand("BundjilWorkspaceName")
);
export type BundjilWorkspaceName = typeof BundjilWorkspaceName.Type;

export const BundjilPackageName = Schema.NonEmptyString.pipe(
  Schema.brand("BundjilPackageName")
);
export type BundjilPackageName = typeof BundjilPackageName.Type;

export const BundjilDefaultWorkspacePackage = Schema.Literals([
  "@bundjil/core",
  "@bundjil/effect-start",
  "@bundjil/eve-effect",
]);
export type BundjilDefaultWorkspacePackage =
  typeof BundjilDefaultWorkspacePackage.Type;

export const defaultWorkspacePackages: readonly BundjilDefaultWorkspacePackage[] =
  ["@bundjil/core", "@bundjil/effect-start", "@bundjil/eve-effect"];

export const WorkspaceSummary = Schema.Struct({
  name: BundjilWorkspaceName,
  packages: Schema.Array(BundjilPackageName),
});
export type WorkspaceSummary = typeof WorkspaceSummary.Type;

export const makeWorkspaceSummary = (
  name = "bundjil"
): Effect.Effect<WorkspaceSummary, Schema.SchemaError> =>
  Effect.gen(function* makeWorkspaceSummary() {
    const packages = yield* Schema.decodeUnknownEffect(
      Schema.Array(BundjilDefaultWorkspacePackage)
    )(defaultWorkspacePackages);

    return yield* Schema.decodeUnknownEffect(WorkspaceSummary)({
      name,
      packages,
    });
  });
