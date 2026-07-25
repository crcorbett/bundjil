// oxlint-disable-next-line eslint-plugin-jsdoc/check-tag-names -- Effect language-service file directive.
/** @effect-diagnostics anyUnknownInErrorContext:off */

import { layerAlchemyR2State } from "@bundjil/infrastructure";
import {
  layerVercelPreviewConfigurationLiveProviders,
  loadVercelPreviewConfigurationInput,
} from "@bundjil/infrastructure/vercel";
import * as Alchemy from "alchemy";
import { Effect } from "effect";

import { BundjilPreviewVercelConfigurationStack } from "./stacks/preview-vercel-configuration.js";

export default loadVercelPreviewConfigurationInput.pipe(
  Effect.flatMap((input) => {
    const providers = layerVercelPreviewConfigurationLiveProviders({
      feedback: {
        stage: "preview",
        teamId: input.teamId,
        projectId: input.projectId,
        desired: input.phase === "desired" ? true : null,
        productionGuard: null,
      },
      environmentMetadata: {
        stage: "preview",
        teamId: input.teamId,
        projectId: input.projectId,
        key: input.environmentKey,
        value: input.environmentValue,
        destructivePolicy: input.destructivePolicy,
      },
    });
    return Alchemy.Stack(
      "BundjilPreviewConfigurationSpike",
      {
        providers,
        state: layerAlchemyR2State,
      },
      BundjilPreviewVercelConfigurationStack(input)
    );
  })
);
