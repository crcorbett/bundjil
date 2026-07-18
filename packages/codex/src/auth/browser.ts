import { Context, Effect, Layer, Redacted } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/unstable/process";

import type { CodexOAuthAuthorizationUrl } from "./credentials.js";
import { CodexSubscriptionAuthError } from "./errors.js";

export interface CodexBrowserLauncherShape {
  readonly open: (
    authorizationUrl: CodexOAuthAuthorizationUrl
  ) => Effect.Effect<void, CodexSubscriptionAuthError>;
}

export class CodexBrowserLauncher extends Context.Service<
  CodexBrowserLauncher,
  CodexBrowserLauncherShape
>()("@bundjil/codex/CodexBrowserLauncher") {}

export const makeCodexBrowserCommand = (
  authorizationUrl: CodexOAuthAuthorizationUrl,
  platform: string
) => {
  const url = Redacted.value(authorizationUrl);

  if (platform.toLowerCase().includes("mac")) {
    return ChildProcess.make("osascript", [
      "-e",
      "on run argv",
      "-e",
      'tell application "Google Chrome" to open location (item 1 of argv)',
      "-e",
      "end run",
      url,
    ]);
  }
  if (platform.toLowerCase().includes("win")) {
    return ChildProcess.make("cmd", ["/c", "start", "", url]);
  }
  return ChildProcess.make("xdg-open", [url]);
};

export const CodexBrowserLauncherCommandLive = Layer.effect(
  CodexBrowserLauncher,
  Effect.gen(function* makeCodexBrowserLauncherCommand() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

    return CodexBrowserLauncher.of({
      open: Effect.fn("CodexBrowserLauncher.open")((authorizationUrl) =>
        spawner
          .exitCode(
            makeCodexBrowserCommand(
              authorizationUrl,
              globalThis.navigator.platform
            )
          )
          .pipe(
            Effect.flatMap((exitCode) =>
              exitCode === 0
                ? Effect.void
                : Effect.fail(
                    new CodexSubscriptionAuthError({
                      operation: "launchBrowser",
                      reason: "browserFailure",
                      message: "The system browser command did not succeed.",
                    })
                  )
            ),
            Effect.mapError(
              () =>
                new CodexSubscriptionAuthError({
                  operation: "launchBrowser",
                  reason: "browserFailure",
                  message: "Unable to open the system browser for Codex login.",
                })
            )
          )
      ),
    });
  })
);

export const CodexBrowserLauncherMemory = (
  open: CodexBrowserLauncherShape["open"] = () => Effect.void
) => Layer.succeed(CodexBrowserLauncher, CodexBrowserLauncher.of({ open }));
