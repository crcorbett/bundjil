import type { Effect } from "effect";
import { Context } from "effect";

import type {
  SyntheticResourceDeleteError,
  SyntheticResourceReadError,
  SyntheticResourceWriteError,
} from "./errors.js";
import type {
  DeletedSyntheticResource,
  DeleteSyntheticResource,
  ListedSyntheticResources,
  ListSyntheticResources,
  ObserveSyntheticResource,
  ReconciledSyntheticResource,
  ReconcileSyntheticResource,
  SyntheticResourceObservation,
} from "./schemas.js";

export interface SyntheticResourcesContract {
  readonly observeResource: (
    input: ObserveSyntheticResource
  ) => Effect.Effect<SyntheticResourceObservation, SyntheticResourceReadError>;
  readonly reconcileResource: (
    input: ReconcileSyntheticResource
  ) => Effect.Effect<ReconciledSyntheticResource, SyntheticResourceWriteError>;
  readonly deleteResource: (
    input: DeleteSyntheticResource
  ) => Effect.Effect<DeletedSyntheticResource, SyntheticResourceDeleteError>;
  readonly listResources: (
    input: ListSyntheticResources
  ) => Effect.Effect<ListedSyntheticResources, SyntheticResourceReadError>;
}

export class SyntheticResources extends Context.Service<
  SyntheticResources,
  SyntheticResourcesContract
>()("@bundjil/infrastructure/SyntheticResources") {}
