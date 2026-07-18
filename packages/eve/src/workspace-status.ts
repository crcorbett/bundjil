import { Effect } from "effect";

export const defaultWorkspacePackages = [
  "@bundjil/codex",
  "@bundjil/eve",
  "@bundjil/store",
] as const;

export interface WorkspaceSummary {
  readonly name: string;
  readonly packages: typeof defaultWorkspacePackages;
}

export const makeWorkspaceSummary = (
  name = "bundjil"
): Effect.Effect<WorkspaceSummary> =>
  Effect.succeed({
    name,
    packages: defaultWorkspacePackages,
  });
