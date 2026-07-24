// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */

import {
  emptyMemoryConfig,
  layerMemory,
  SyntheticResourceProvider,
} from "@bundjil/infrastructure";
import * as Alchemy from "alchemy";
import { localState } from "alchemy/State";
import { Layer } from "effect";

import { BundjilInfrastructureStack } from "./stacks/bundjil.js";

const syntheticMemory = layerMemory(emptyMemoryConfig);
const offlineProviders = Layer.merge(
  SyntheticResourceProvider.pipe(Layer.provide(syntheticMemory)),
  syntheticMemory
);

export default Alchemy.Stack(
  "BundjilInfrastructure",
  {
    providers: offlineProviders,
    state: localState(),
  },
  BundjilInfrastructureStack
);
