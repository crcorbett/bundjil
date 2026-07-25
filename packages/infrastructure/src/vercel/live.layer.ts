import type { Effect as EffectType } from "effect";
import {
  Array,
  Config,
  Context,
  Effect,
  Layer,
  Option,
  Redacted,
  Schedule,
  Schema,
} from "effect";
import type { ConfigError } from "effect/Config";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http";

import {
  VercelDeploymentsReadError,
  VercelDomainsReadError,
  VercelEnvironmentVariablesReadError,
  VercelMarketplaceBindingsReadError,
  VercelProjectsReadError,
} from "./errors.js";
import type {
  DiscoverVercelProject,
  ObserveVercelDeployment,
  ObserveVercelEnvironmentVariable,
  ObserveVercelMarketplaceBinding,
  ObserveVercelProjectDomain,
} from "./schemas.js";
import {
  ListedVercelDeployments,
  ListedVercelEnvironmentVariables,
  ListedVercelMarketplaceBindings,
  ListedVercelProjectDomains,
  ListedVercelProjects,
  ObserveVercelProject,
  VercelCanonicalDomain,
  VercelDeploymentId,
  VercelDeploymentObservation,
  VercelDeploymentObservationAttributes,
  VercelDeploymentStatus,
  VercelDeploymentTarget,
  VercelEnvironmentTarget,
  VercelEnvironmentVariableAttributes,
  VercelEnvironmentVariableId,
  VercelEnvironmentVariableKey,
  VercelEnvironmentVariableObservation,
  VercelEnvironmentVariableType,
  VercelGitBranch,
  VercelGitSha,
  VercelIntegrationConfigurationId,
  VercelIntegrationId,
  VercelMarketplaceBindingAttributes,
  VercelMarketplaceBindingObservation,
  VercelMarketplaceDatabaseId,
  VercelMarketplaceResourceId,
  VercelPaginationCursor,
  VercelProjectAttributes,
  VercelProjectDomainAttributes,
  VercelProjectDomainObservation,
  VercelProjectDiscovery,
  VercelProjectId,
  VercelProjectName,
  VercelProjectObservation,
  ListVercelDeployments,
  ListVercelEnvironmentVariables,
  ListVercelMarketplaceBindings,
  ListVercelProjectDomains,
  ListVercelProjects,
} from "./schemas.js";
import {
  VercelDeployments,
  VercelDomains,
  VercelEnvironmentVariables,
  VercelMarketplaceBindings,
  VercelProjects,
} from "./services.js";

export const VercelAccessToken = Schema.Redacted(Schema.NonEmptyString);
export type VercelAccessToken = typeof VercelAccessToken.Type;
export type VercelAccessTokenEncoded = typeof VercelAccessToken.Encoded;

const vercelAccessTokenConfig = Config.schema(
  VercelAccessToken,
  "VERCEL_INFRASTRUCTURE_ACCESS_TOKEN"
);

export class VercelCredentials extends Context.Service<
  VercelCredentials,
  EffectType.Effect<VercelAccessToken, ConfigError>
>()("@bundjil/infrastructure/vercel/VercelCredentials") {}

export const VercelCredentialsLive = Layer.succeed(
  VercelCredentials,
  vercelAccessTokenConfig
);

const VercelResponseHeaders = Schema.Struct({
  "x-ratelimit-remaining": Schema.optional(Schema.String),
  "x-ratelimit-reset": Schema.optional(Schema.String),
  "retry-after": Schema.optional(Schema.String),
});

const VercelErrorBody = Schema.Struct({
  error: Schema.Struct({
    code: Schema.optional(Schema.String),
    message: Schema.optional(Schema.String),
  }),
});

const VercelFailureEnvelope = Schema.Union([
  Schema.Struct({
    status: Schema.Literal(404),
    headers: VercelResponseHeaders,
    body: VercelErrorBody,
  }),
  Schema.Struct({
    status: Schema.Literal(429),
    headers: VercelResponseHeaders,
    body: VercelErrorBody,
  }),
  Schema.Struct({
    status: Schema.Literals([500, 502, 503, 504]),
    headers: VercelResponseHeaders,
    body: VercelErrorBody,
  }),
]);

const VercelProviderProject = Schema.Struct({
  id: VercelProjectId,
  name: VercelProjectName,
  framework: Schema.NullOr(Schema.String),
  rootDirectory: Schema.NullOr(Schema.String),
});

const VercelProjectsSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: Schema.Struct({
    projects: Schema.Array(VercelProviderProject),
    pagination: Schema.Struct({
      next: Schema.NullOr(VercelPaginationCursor),
    }),
  }),
});
const VercelProjectsEnvelope = Schema.Union([
  VercelProjectsSuccessEnvelope,
  VercelFailureEnvelope,
]);

const VercelProjectSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: VercelProviderProject,
});
const VercelProjectEnvelope = Schema.Union([
  VercelProjectSuccessEnvelope,
  VercelFailureEnvelope,
]);

const VercelDomainsSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: Schema.Struct({
    domains: Schema.Array(
      Schema.Struct({
        name: VercelCanonicalDomain,
        verified: Schema.Boolean,
      })
    ),
    pagination: Schema.optional(
      Schema.Struct({ next: Schema.NullOr(VercelPaginationCursor) })
    ),
  }),
});
const VercelDomainsEnvelope = Schema.Union([
  VercelDomainsSuccessEnvelope,
  VercelFailureEnvelope,
]);

const VercelMarketplaceContentHint = Schema.Struct({
  integrationConfigurationId: VercelIntegrationConfigurationId,
  integrationId: VercelIntegrationId,
  storeId: VercelMarketplaceResourceId,
});
type VercelMarketplaceContentHint = typeof VercelMarketplaceContentHint.Type;

const VercelEnvironmentVariablesSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: Schema.Struct({
    envs: Schema.Array(
      Schema.Struct({
        id: VercelEnvironmentVariableId,
        key: VercelEnvironmentVariableKey,
        type: VercelEnvironmentVariableType,
        target: Schema.Array(VercelEnvironmentTarget),
        gitBranch: Schema.optional(VercelGitBranch),
        sensitive: Schema.optional(Schema.Boolean),
        contentHint: Schema.optional(VercelMarketplaceContentHint),
      })
    ),
    pagination: Schema.optional(
      Schema.Struct({ next: Schema.NullOr(VercelPaginationCursor) })
    ),
  }),
});
const VercelEnvironmentVariablesEnvelope = Schema.Union([
  VercelEnvironmentVariablesSuccessEnvelope,
  VercelFailureEnvelope,
]);

const VercelMarketplaceStorageStoresSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: Schema.Struct({
    stores: Schema.Array(
      Schema.Union([
        Schema.Struct({
          id: VercelMarketplaceResourceId,
          externalResourceId: VercelMarketplaceDatabaseId,
          type: Schema.Literal("integration"),
          product: Schema.Struct({
            integrationConfigurationId: VercelIntegrationConfigurationId,
            integration: Schema.Struct({
              id: VercelIntegrationId,
            }),
          }),
          projectsMetadata: Schema.Array(
            Schema.Struct({
              projectId: VercelProjectId,
            })
          ),
        }),
        Schema.Struct({
          type: Schema.optional(Schema.Literal("blob")),
        }),
      ])
    ),
  }),
});
const VercelMarketplaceStorageStoresEnvelope = Schema.Union([
  VercelMarketplaceStorageStoresSuccessEnvelope,
  VercelFailureEnvelope,
]);

const VercelDeploymentsSuccessEnvelope = Schema.Struct({
  status: Schema.Literal(200),
  headers: VercelResponseHeaders,
  body: Schema.Struct({
    deployments: Schema.Array(
      Schema.Struct({
        uid: VercelDeploymentId,
        projectId: VercelProjectId,
        target: VercelDeploymentTarget,
        readyState: VercelDeploymentStatus,
        alias: Schema.Array(VercelCanonicalDomain),
        meta: Schema.Struct({ githubCommitSha: VercelGitSha }),
      })
    ),
    pagination: Schema.Struct({
      next: Schema.NullOr(VercelPaginationCursor),
    }),
  }),
});
const VercelDeploymentsEnvelope = Schema.Union([
  VercelDeploymentsSuccessEnvelope,
  VercelFailureEnvelope,
]);

const retrySchedule = Schedule.exponential("10 millis").pipe(Schedule.jittered);

const vercelUrl = (path: string) => new URL(path, "https://api.vercel.com");

const withVercelAuthorization = (
  request: HttpClientRequest.HttpClientRequest,
  token: VercelAccessToken
) =>
  request.pipe(
    HttpClientRequest.setHeader(
      "authorization",
      `Bearer ${Redacted.value(token)}`
    )
  );

export const VercelLive = Layer.effectContext(
  Effect.gen(function* makeVercelLive() {
    const client = yield* HttpClient.HttpClient;
    const credentials = yield* VercelCredentials;

    const listProjects = Effect.fn("VercelProjectsLive.listProjects")(
      function* (input: ListVercelProjects) {
        const encoded = yield* Schema.encodeEffect(ListVercelProjects)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new VercelProjectsReadError({
                operation: "listProjects",
                reason: "requestFailed",
                retry: "never",
                message: "The Vercel projects request could not be encoded.",
              })
          )
        );
        const token = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new VercelProjectsReadError({
                operation: "listProjects",
                reason: "requestFailed",
                retry: "never",
                message: "Vercel read credentials are unavailable.",
              })
          )
        );
        const projects: VercelProjectAttributes[] = [];
        let cursor: string | undefined;
        do {
          const response = yield* client
            .execute(
              withVercelAuthorization(
                HttpClientRequest.get(vercelUrl("/v9/projects")).pipe(
                  HttpClientRequest.setUrlParam("teamId", encoded.teamId),
                  cursor === undefined
                    ? (request) => request
                    : HttpClientRequest.setUrlParam("until", cursor)
                ),
                token
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(VercelProjectsEnvelope)
              ),
              Effect.mapError(
                () =>
                  new VercelProjectsReadError({
                    operation: "listProjects",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Vercel returned an invalid projects response envelope.",
                  })
              ),
              Effect.retry({
                schedule: retrySchedule,
                times: 2,
                while: (failure) => failure.retry === "backoff",
              })
            );
          if (response.status !== 200) {
            const nonMissingReason =
              response.status === 429 ? "rateLimited" : "transient";
            const reason =
              response.status === 404 ? "notFound" : nonMissingReason;
            return yield* new VercelProjectsReadError({
              operation: "listProjects",
              reason,
              retry: response.status === 404 ? "never" : "backoff",
              message: "Vercel could not list projects for the scoped team.",
            });
          }
          projects.push(
            ...response.body.projects.map((project) =>
              VercelProjectAttributes.make({
                stage: input.stage,
                teamId: input.teamId,
                projectId: project.id,
                name: project.name,
                framework:
                  project.framework === "vite" || project.framework === "nextjs"
                    ? project.framework
                    : "other",
                rootDirectory: project.rootDirectory,
                ownership: "Unowned",
              })
            )
          );
          cursor = response.body.pagination.next ?? undefined;
        } while (cursor !== undefined);
        return ListedVercelProjects.make({ projects });
      }
    );

    const observeProject = Effect.fn("VercelProjectsLive.observeProject")(
      function* (input: ObserveVercelProject) {
        const encoded = yield* Schema.encodeEffect(ObserveVercelProject)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new VercelProjectsReadError({
                operation: "observeProject",
                reason: "requestFailed",
                retry: "never",
                message: "The Vercel project request could not be encoded.",
              })
          )
        );
        const token = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new VercelProjectsReadError({
                operation: "observeProject",
                reason: "requestFailed",
                retry: "never",
                message: "Vercel read credentials are unavailable.",
              })
          )
        );
        const response = yield* client
          .execute(
            withVercelAuthorization(
              HttpClientRequest.get(
                vercelUrl(`/v9/projects/${encoded.projectId}`)
              ).pipe(HttpClientRequest.setUrlParam("teamId", encoded.teamId)),
              token
            )
          )
          .pipe(
            Effect.flatMap(
              HttpClientResponse.schemaJson(VercelProjectEnvelope)
            ),
            Effect.mapError(
              () =>
                new VercelProjectsReadError({
                  operation: "observeProject",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Vercel returned an invalid project response envelope.",
                })
            )
          );
        if (response.status === 404) {
          return VercelProjectObservation.make({
            _tag: "Missing",
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
          });
        }
        if (response.status !== 200) {
          return yield* new VercelProjectsReadError({
            operation: "observeProject",
            reason: response.status === 429 ? "rateLimited" : "transient",
            retry: "backoff",
            message: "Vercel could not observe the scoped project.",
          });
        }
        return VercelProjectObservation.make({
          _tag: "Found",
          attributes: VercelProjectAttributes.make({
            stage: input.stage,
            teamId: input.teamId,
            projectId: response.body.id,
            name: response.body.name,
            framework:
              response.body.framework === "vite" ||
              response.body.framework === "nextjs"
                ? response.body.framework
                : "other",
            rootDirectory: response.body.rootDirectory,
            ownership: "Unowned",
          }),
        });
      }
    );

    const discoverProject = Effect.fn("VercelProjectsLive.discoverProject")(
      function* (input: DiscoverVercelProject) {
        const listed = yield* listProjects(input);
        const matches = listed.projects.filter(
          (project) => project.name === input.name
        );
        if (matches.length > 1) {
          return yield* new VercelProjectsReadError({
            operation: "discoverProject",
            reason: "ambiguous",
            retry: "never",
            message:
              "More than one Vercel project matched the scoped project name.",
          });
        }
        return Option.match(Array.head(matches), {
          onNone: () =>
            VercelProjectDiscovery.make({
              _tag: "Missing",
              stage: input.stage,
              teamId: input.teamId,
              name: input.name,
            }),
          onSome: (attributes) =>
            VercelProjectDiscovery.make({ _tag: "Found", attributes }),
        });
      }
    );

    const listDomains = Effect.fn("VercelDomainsLive.listDomains")(function* (
      input: ListVercelProjectDomains
    ) {
      const encoded = yield* Schema.encodeEffect(ListVercelProjectDomains)(
        input
      ).pipe(
        Effect.mapError(
          () =>
            new VercelDomainsReadError({
              operation: "listDomains",
              reason: "requestFailed",
              retry: "never",
              message: "The Vercel domains request could not be encoded.",
            })
        )
      );
      const token = yield* credentials.pipe(
        Effect.mapError(
          () =>
            new VercelDomainsReadError({
              operation: "listDomains",
              reason: "requestFailed",
              retry: "never",
              message: "Vercel read credentials are unavailable.",
            })
        )
      );
      const domains: VercelProjectDomainAttributes[] = [];
      let cursor: string | undefined;
      do {
        const response = yield* client
          .execute(
            withVercelAuthorization(
              HttpClientRequest.get(
                vercelUrl(`/v9/projects/${encoded.projectId}/domains`)
              ).pipe(
                HttpClientRequest.setUrlParam("teamId", encoded.teamId),
                cursor === undefined
                  ? (request) => request
                  : HttpClientRequest.setUrlParam("until", cursor)
              ),
              token
            )
          )
          .pipe(
            Effect.flatMap(
              HttpClientResponse.schemaJson(VercelDomainsEnvelope)
            ),
            Effect.mapError(
              () =>
                new VercelDomainsReadError({
                  operation: "listDomains",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Vercel returned an invalid domains response envelope.",
                })
            )
          );
        if (response.status !== 200) {
          return yield* new VercelDomainsReadError({
            operation: "listDomains",
            reason: response.status === 429 ? "rateLimited" : "transient",
            retry: "backoff",
            message: "Vercel could not list project domains.",
          });
        }
        domains.push(
          ...response.body.domains.map((domain) =>
            VercelProjectDomainAttributes.make({
              stage: input.stage,
              teamId: input.teamId,
              projectId: input.projectId,
              domain: domain.name,
              verified: domain.verified,
              ownership: "Unowned",
            })
          )
        );
        cursor = response.body.pagination?.next ?? undefined;
      } while (cursor !== undefined);
      return ListedVercelProjectDomains.make({ domains });
    });

    const observeDomain = Effect.fn("VercelDomainsLive.observeDomain")(
      function* (input: ObserveVercelProjectDomain) {
        const listed = yield* listDomains(input);
        return Option.match(
          Array.findFirst(
            listed.domains,
            (domain) => domain.domain === input.domain
          ),
          {
            onNone: () =>
              VercelProjectDomainObservation.make({
                _tag: "Missing",
                stage: input.stage,
                teamId: input.teamId,
                projectId: input.projectId,
                domain: input.domain,
              }),
            onSome: (attributes) =>
              VercelProjectDomainObservation.make({
                _tag: "Found",
                attributes,
              }),
          }
        );
      }
    );

    const listEnvironmentVariables = Effect.fn(
      "VercelEnvironmentVariablesLive.listEnvironmentVariables"
    )(function* (input: ListVercelEnvironmentVariables) {
      const encoded = yield* Schema.encodeEffect(
        ListVercelEnvironmentVariables
      )(input).pipe(
        Effect.mapError(
          () =>
            new VercelEnvironmentVariablesReadError({
              operation: "listEnvironmentVariables",
              reason: "requestFailed",
              retry: "never",
              message:
                "The Vercel environment metadata request could not be encoded.",
            })
        )
      );
      const token = yield* credentials.pipe(
        Effect.mapError(
          () =>
            new VercelEnvironmentVariablesReadError({
              operation: "listEnvironmentVariables",
              reason: "requestFailed",
              retry: "never",
              message: "Vercel read credentials are unavailable.",
            })
        )
      );
      const environmentVariables: VercelEnvironmentVariableAttributes[] = [];
      let cursor: string | undefined;
      do {
        const response = yield* client
          .execute(
            withVercelAuthorization(
              HttpClientRequest.get(
                vercelUrl(`/v10/projects/${encoded.projectId}/env`)
              ).pipe(
                HttpClientRequest.setUrlParam("teamId", encoded.teamId),
                cursor === undefined
                  ? (request) => request
                  : HttpClientRequest.setUrlParam("until", cursor)
              ),
              token
            )
          )
          .pipe(
            Effect.flatMap(
              HttpClientResponse.schemaJson(VercelEnvironmentVariablesEnvelope)
            ),
            Effect.mapError(
              () =>
                new VercelEnvironmentVariablesReadError({
                  operation: "listEnvironmentVariables",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Vercel returned an invalid environment metadata envelope.",
                })
            )
          );
        if (response.status !== 200) {
          return yield* new VercelEnvironmentVariablesReadError({
            operation: "listEnvironmentVariables",
            reason: response.status === 429 ? "rateLimited" : "transient",
            retry: "backoff",
            message: "Vercel could not list environment metadata.",
          });
        }
        environmentVariables.push(
          ...response.body.envs.map((environmentVariable) =>
            VercelEnvironmentVariableAttributes.make({
              stage: input.stage,
              teamId: input.teamId,
              projectId: input.projectId,
              environmentVariableId: environmentVariable.id,
              key: environmentVariable.key,
              type: environmentVariable.type,
              targets: environmentVariable.target,
              gitBranch: environmentVariable.gitBranch,
              sensitive:
                environmentVariable.sensitive === true ||
                environmentVariable.type === "sensitive" ||
                environmentVariable.type === "encrypted" ||
                environmentVariable.type === "secret",
              ownership: "Unowned",
            })
          )
        );
        cursor = response.body.pagination?.next ?? undefined;
      } while (cursor !== undefined);
      return ListedVercelEnvironmentVariables.make({ environmentVariables });
    });

    const observeEnvironmentVariable = Effect.fn(
      "VercelEnvironmentVariablesLive.observeEnvironmentVariable"
    )(function* (input: ObserveVercelEnvironmentVariable) {
      const listed = yield* listEnvironmentVariables(input);
      return Option.match(
        Array.findFirst(
          listed.environmentVariables,
          (environmentVariable) =>
            environmentVariable.environmentVariableId ===
            input.environmentVariableId
        ),
        {
          onNone: () =>
            VercelEnvironmentVariableObservation.make({
              _tag: "Missing",
              stage: input.stage,
              teamId: input.teamId,
              projectId: input.projectId,
              environmentVariableId: input.environmentVariableId,
            }),
          onSome: (attributes) =>
            VercelEnvironmentVariableObservation.make({
              _tag: "Found",
              attributes,
            }),
        }
      );
    });

    const listMarketplaceBindings = Effect.fn(
      "VercelMarketplaceBindingsLive.listMarketplaceBindings"
    )(function* (input: ListVercelMarketplaceBindings) {
      const encoded = yield* Schema.encodeEffect(ListVercelMarketplaceBindings)(
        input
      ).pipe(
        Effect.mapError(
          () =>
            new VercelMarketplaceBindingsReadError({
              operation: "listMarketplaceBindings",
              reason: "requestFailed",
              retry: "never",
              message: "The Vercel Marketplace request could not be encoded.",
            })
        )
      );
      const token = yield* credentials.pipe(
        Effect.mapError(
          () =>
            new VercelMarketplaceBindingsReadError({
              operation: "listMarketplaceBindings",
              reason: "requestFailed",
              retry: "never",
              message: "Vercel read credentials are unavailable.",
            })
        )
      );
      const contentHints: (typeof VercelMarketplaceContentHint.Type)[] = [];
      let cursor: string | undefined;
      do {
        const response = yield* client
          .execute(
            withVercelAuthorization(
              HttpClientRequest.get(
                vercelUrl(`/v10/projects/${encoded.projectId}/env`)
              ).pipe(
                HttpClientRequest.setUrlParam("teamId", encoded.teamId),
                cursor === undefined
                  ? (request) => request
                  : HttpClientRequest.setUrlParam("until", cursor)
              ),
              token
            )
          )
          .pipe(
            Effect.flatMap(
              HttpClientResponse.schemaJson(VercelEnvironmentVariablesEnvelope)
            ),
            Effect.mapError(
              () =>
                new VercelMarketplaceBindingsReadError({
                  operation: "listMarketplaceBindings",
                  reason: "invalidResponse",
                  retry: "never",
                  message:
                    "Vercel returned invalid Marketplace environment metadata.",
                })
            )
          );
        if (response.status !== 200) {
          return yield* new VercelMarketplaceBindingsReadError({
            operation: "listMarketplaceBindings",
            reason: response.status === 429 ? "rateLimited" : "transient",
            retry: "backoff",
            message: "Vercel could not list Marketplace bindings.",
          });
        }
        contentHints.push(
          ...response.body.envs.flatMap((environmentVariable) =>
            environmentVariable.contentHint === undefined
              ? []
              : [environmentVariable.contentHint]
          )
        );
        cursor = response.body.pagination?.next ?? undefined;
      } while (cursor !== undefined);

      const storesResponse = yield* client
        .execute(
          withVercelAuthorization(
            HttpClientRequest.get(vercelUrl("/v1/storage/stores")).pipe(
              HttpClientRequest.setUrlParam("teamId", encoded.teamId)
            ),
            token
          )
        )
        .pipe(
          Effect.flatMap(
            HttpClientResponse.schemaJson(
              VercelMarketplaceStorageStoresEnvelope
            )
          ),
          Effect.mapError(
            () =>
              new VercelMarketplaceBindingsReadError({
                operation: "listMarketplaceBindings",
                reason: "invalidResponse",
                retry: "never",
                message:
                  "Vercel returned an invalid Marketplace storage envelope.",
              })
          )
        );
      if (storesResponse.status !== 200) {
        return yield* new VercelMarketplaceBindingsReadError({
          operation: "listMarketplaceBindings",
          reason: storesResponse.status === 429 ? "rateLimited" : "transient",
          retry: "backoff",
          message: "Vercel could not list Marketplace storage bindings.",
        });
      }

      const bindings = yield* Effect.forEach(
        Array.dedupeWith(
          contentHints,
          (left, right) =>
            left.integrationConfigurationId ===
              right.integrationConfigurationId &&
            left.integrationId === right.integrationId &&
            left.storeId === right.storeId
        ),
        Effect.fn(
          "VercelMarketplaceBindingsLive.resolveMarketplaceContentHint"
        )(function* (contentHint: VercelMarketplaceContentHint) {
          const matches = storesResponse.body.stores.filter(
            (store) =>
              store.type === "integration" &&
              store.id === contentHint.storeId &&
              store.product.integrationConfigurationId ===
                contentHint.integrationConfigurationId &&
              store.product.integration.id === contentHint.integrationId &&
              store.projectsMetadata.some(
                (project) => project.projectId === input.projectId
              )
          );
          const [store] = matches;
          if (
            store === undefined ||
            store.type !== "integration" ||
            matches.length !== 1
          ) {
            return yield* new VercelMarketplaceBindingsReadError({
              operation: "listMarketplaceBindings",
              reason: store === undefined ? "notFound" : "ambiguous",
              retry: "never",
              message:
                "Vercel Marketplace metadata did not identify one exact customer storage binding.",
            });
          }
          return VercelMarketplaceBindingAttributes.make({
            stage: input.stage,
            teamId: input.teamId,
            projectId: input.projectId,
            integrationId: contentHint.integrationId,
            configurationId: contentHint.integrationConfigurationId,
            resourceId: store.id,
            databaseId: store.externalResourceId,
            ownership: "Unowned",
          });
        })
      );
      return ListedVercelMarketplaceBindings.make({ bindings });
    });

    const observeMarketplaceBinding = Effect.fn(
      "VercelMarketplaceBindingsLive.observeMarketplaceBinding"
    )(function* (input: ObserveVercelMarketplaceBinding) {
      const listed = yield* listMarketplaceBindings(input);
      return Option.match(
        Array.findFirst(
          listed.bindings,
          (binding) => binding.resourceId === input.resourceId
        ),
        {
          onNone: () =>
            VercelMarketplaceBindingObservation.make({
              _tag: "Missing",
              stage: input.stage,
              teamId: input.teamId,
              projectId: input.projectId,
              resourceId: input.resourceId,
            }),
          onSome: (attributes) =>
            VercelMarketplaceBindingObservation.make({
              _tag: "Found",
              attributes,
            }),
        }
      );
    });

    const listDeployments = Effect.fn("VercelDeploymentsLive.listDeployments")(
      function* (input: ListVercelDeployments) {
        const encoded = yield* Schema.encodeEffect(ListVercelDeployments)(
          input
        ).pipe(
          Effect.mapError(
            () =>
              new VercelDeploymentsReadError({
                operation: "listDeployments",
                reason: "requestFailed",
                retry: "never",
                message: "The Vercel deployments request could not be encoded.",
              })
          )
        );
        const token = yield* credentials.pipe(
          Effect.mapError(
            () =>
              new VercelDeploymentsReadError({
                operation: "listDeployments",
                reason: "requestFailed",
                retry: "never",
                message: "Vercel read credentials are unavailable.",
              })
          )
        );
        const deployments: VercelDeploymentObservationAttributes[] = [];
        let cursor: string | undefined;
        do {
          const response = yield* client
            .execute(
              withVercelAuthorization(
                HttpClientRequest.get(vercelUrl("/v6/deployments")).pipe(
                  HttpClientRequest.setUrlParam("teamId", encoded.teamId),
                  HttpClientRequest.setUrlParam("projectId", encoded.projectId),
                  cursor === undefined
                    ? (request) => request
                    : HttpClientRequest.setUrlParam("until", cursor)
                ),
                token
              )
            )
            .pipe(
              Effect.flatMap(
                HttpClientResponse.schemaJson(VercelDeploymentsEnvelope)
              ),
              Effect.mapError(
                () =>
                  new VercelDeploymentsReadError({
                    operation: "listDeployments",
                    reason: "invalidResponse",
                    retry: "never",
                    message:
                      "Vercel returned an invalid deployments response envelope.",
                  })
              )
            );
          if (response.status !== 200) {
            return yield* new VercelDeploymentsReadError({
              operation: "listDeployments",
              reason: response.status === 429 ? "rateLimited" : "transient",
              retry: "backoff",
              message: "Vercel could not list deployment observations.",
            });
          }
          deployments.push(
            ...response.body.deployments.map((deployment) =>
              VercelDeploymentObservationAttributes.make({
                stage: input.stage,
                teamId: input.teamId,
                projectId: deployment.projectId,
                deploymentId: deployment.uid,
                gitSha: deployment.meta.githubCommitSha,
                target: deployment.target,
                status: deployment.readyState,
                aliases: deployment.alias,
                ownership: "Unowned",
              })
            )
          );
          cursor = response.body.pagination.next ?? undefined;
        } while (cursor !== undefined);
        return ListedVercelDeployments.make({ deployments });
      }
    );

    const observeDeployment = Effect.fn(
      "VercelDeploymentsLive.observeDeployment"
    )(function* (input: ObserveVercelDeployment) {
      const listed = yield* listDeployments(input);
      return Option.match(
        Array.findFirst(
          listed.deployments,
          (deployment) => deployment.deploymentId === input.deploymentId
        ),
        {
          onNone: () =>
            VercelDeploymentObservation.make({
              _tag: "Missing",
              stage: input.stage,
              teamId: input.teamId,
              projectId: input.projectId,
              deploymentId: input.deploymentId,
            }),
          onSome: (attributes) =>
            VercelDeploymentObservation.make({
              _tag: "Found",
              attributes,
            }),
        }
      );
    });

    return Context.empty().pipe(
      Context.add(
        VercelProjects,
        VercelProjects.of({ discoverProject, observeProject, listProjects })
      ),
      Context.add(
        VercelDomains,
        VercelDomains.of({ observeDomain, listDomains })
      ),
      Context.add(
        VercelEnvironmentVariables,
        VercelEnvironmentVariables.of({
          observeEnvironmentVariable,
          listEnvironmentVariables,
        })
      ),
      Context.add(
        VercelMarketplaceBindings,
        VercelMarketplaceBindings.of({
          observeMarketplaceBinding,
          listMarketplaceBindings,
        })
      ),
      Context.add(
        VercelDeployments,
        VercelDeployments.of({ observeDeployment, listDeployments })
      )
    );
  })
);
