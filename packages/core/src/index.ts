import { Effect } from "effect";

export interface WorkspaceSummary {
  readonly name: string;
  readonly packages: readonly string[];
}

export const defaultWorkspacePackages = [
  "@bundjil/core",
  "@bundjil/effect-start",
  "@bundjil/eve-effect",
] as const;

export const makeWorkspaceSummary = (
  name = "bundjil"
): Effect.Effect<WorkspaceSummary> =>
  Effect.succeed({
    name,
    packages: defaultWorkspacePackages,
  });
