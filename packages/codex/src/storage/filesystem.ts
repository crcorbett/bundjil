import * as BunServices from "@effect/platform-bun/BunServices";
import { Layer } from "effect";
import * as KeyValueStore from "effect/unstable/persistence/KeyValueStore";

import type { CodexFileSystemDirectory } from "../auth/credentials.js";

/**
 * Explicit persistent KeyValueStore for trusted local Bun processes.
 *
 * Callers own the directory selection and must not use this layer in a
 * deployed serverless runtime.
 */
export const CodexFileSystemKeyValueStoreLive = (
  directory: CodexFileSystemDirectory
) =>
  KeyValueStore.layerFileSystem(directory).pipe(
    Layer.provide(BunServices.layer)
  );
