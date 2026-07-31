import { Schema } from "effect";

import { AlchemyLogicalResourceId } from "./schemas.js";
import {
  VercelEnvironmentVariableAttributes,
  VercelEnvironmentVariableDesiredState,
} from "./vercel/schemas.js";

export const ManagedStableEnvironmentStateResource = Schema.Struct({
  logicalId: AlchemyLogicalResourceId,
  status: Schema.Literal("updated"),
  props: Schema.Struct({
    desired: VercelEnvironmentVariableDesiredState,
  }),
  attr: VercelEnvironmentVariableAttributes,
});
export type ManagedStableEnvironmentStateResource =
  typeof ManagedStableEnvironmentStateResource.Type;
