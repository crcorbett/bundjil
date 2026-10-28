import { Credentials, Endpoint, Region } from "@distilled.cloud/aws";
import { assert, it } from "@effect/vitest";
import {
  Array,
  ConfigProvider,
  Effect,
  Exit,
  HashMap,
  Layer,
  Option,
  Redacted,
  Ref,
  Schema,
  Scope,
  Stream,
} from "effect";
import { HttpClient, HttpClientResponse } from "effect/http";

import { makeAlchemyR2State } from "../src/state/r2-objects.js";
import { loadAlchemyR2StateConfig } from "../src/state/r2-state.js";

const StateObject = Schema.Struct({
  text: Schema.String,
  version: Schema.String,
});
const LegacyAttributes = Schema.Struct({
  enabled: Schema.Boolean,
  nullable: Schema.Null,
  name: Schema.String,
});
const legacyKey =
  "bundjil/v1/BundjilInfrastructure/preview/LegacyResource.json";
const leaseKey = "bundjil/v1/BundjilInfrastructure/preview/__lease__.json";
const legacyRow =
  '{"status":"created","resourceType":"Bundjil.Infrastructure.SyntheticResource","logicalId":"LegacyResource","fqn":"LegacyResource","instanceId":"existing-instance","providerVersion":0,"downstream":[],"bindings":[],"removalPolicy":"retain","props":{"enabled":false,"nullable":null},"attr":{"enabled":false,"nullable":null,"name":"existing"}}';

const config = loadAlchemyR2StateConfig.pipe(
  Effect.provideService(
    ConfigProvider.ConfigProvider,
    ConfigProvider.fromUnknown({
      BUNDJIL_ALCHEMY_STATE_ACCESS_KEY_ID: "r2-access-sentinel",
      BUNDJIL_ALCHEMY_STATE_SECRET_ACCESS_KEY: "r2-secret-sentinel",
    })
  )
);

const transport = Effect.gen(function* makeR2Transport() {
  const objects = yield* Ref.make(
    HashMap.make([
      legacyKey,
      StateObject.make({ text: legacyRow, version: '"legacy-version"' }),
    ])
  );
  const requests = yield* Ref.make<
    readonly { readonly method: string; readonly key: string }[]
  >([]);
  const client = HttpClient.make((request) =>
    Effect.gen(function* handleR2Request() {
      const url = new URL(request.url);
      const key = decodeURIComponent(
        url.pathname
          .replace(/^\/bundjil-alchemy-state\/?/u, "")
          .replace(/^\//u, "")
      );
      yield* Ref.update(
        requests,
        Array.append({ method: request.method, key })
      );
      const current = HashMap.get(yield* Ref.get(objects), key);
      const reply = (
        body: string | null,
        status = 200,
        version = '"version"'
      ) =>
        HttpClientResponse.fromWeb(
          request,
          new Response(body, { status, headers: { etag: version } })
        );
      if (request.method === "HEAD") {
        return reply(null);
      }
      if (request.method === "GET") {
        return Option.match(current, {
          onNone: () => reply("<Error><Code>NoSuchKey</Code></Error>", 404),
          onSome: (object) => reply(object.text, 200, object.version),
        });
      }
      if (request.method === "DELETE") {
        assert.strictEqual(
          request.headers["if-match"],
          Option.getOrUndefined(current)?.version
        );
        yield* Ref.update(objects, HashMap.remove(key));
        return reply(null, 204);
      }
      assert.strictEqual(request.method, "PUT");
      if (
        (request.headers["if-none-match"] === "*" && Option.isSome(current)) ||
        (request.headers["if-match"] !== undefined &&
          request.headers["if-match"] !==
            Option.getOrUndefined(current)?.version)
      ) {
        return reply("<Error><Code>PreconditionFailed</Code></Error>", 412);
      }
      const text = yield* (() => {
        if (request.body._tag === "Uint8Array") {
          return Effect.succeed(new TextDecoder().decode(request.body.body));
        }
        if (request.body._tag === "Stream") {
          return Stream.mkString(
            Stream.decodeText(request.body.stream).pipe(Stream.orDie)
          );
        }
        return Effect.die("Expected the S3 client's encoded object body.");
      })();
      const version = `"version-${(yield* Ref.get(requests)).length}"`;
      yield* Ref.update(objects, HashMap.set(key, { text, version }));
      return reply(null, 200, version);
    })
  );
  return { client, objects, requests };
});

const dependencies = (client: HttpClient.HttpClient) =>
  Layer.mergeAll(
    Credentials.fromCredentials(
      {
        accessKeyId: Redacted.make("r2-access-sentinel"),
        secretAccessKey: Redacted.make("r2-secret-sentinel"),
      },
      "auto"
    ),
    Layer.succeed(Region.Region, Effect.succeed("auto")),
    Layer.succeed(Endpoint.Endpoint, Effect.succeed("https://r2.test")),
    Layer.succeed(HttpClient.HttpClient, client)
  );

it.effect(
  "reads historical R2 records, round-trips native state and releases its conditional lease",
  () =>
    Effect.gen(function* () {
      const fixture = yield* transport;
      yield* Effect.scoped(
        Effect.gen(function* () {
          const state = yield* makeAlchemyR2State(yield* config).pipe(
            Effect.provide(dependencies(fixture.client))
          );
          const address = {
            stack: "BundjilInfrastructure",
            stage: "preview",
            fqn: "LegacyResource",
          };
          const prior = yield* state.get(address);
          const checked = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ attr: LegacyAttributes })
          )(prior);
          assert.deepStrictEqual(checked.attr, {
            enabled: false,
            nullable: null,
            name: "existing",
          });
          if (prior === undefined) {
            return yield* Effect.die("Expected the historical row.");
          }
          yield* state.set({ ...address, value: prior });
          const again = yield* Schema.decodeUnknownEffect(
            Schema.Struct({ attr: LegacyAttributes })
          )(yield* state.get(address));
          assert.deepStrictEqual(again, checked);
          assert.isTrue(HashMap.has(yield* Ref.get(fixture.objects), leaseKey));
          const requests = yield* Ref.get(fixture.requests);
          assert.isTrue(
            requests.every(
              ({ key }) => key === "" || key === legacyKey || key === leaseKey
            )
          );
          return yield* Effect.void;
        })
      );
      assert.isFalse(HashMap.has(yield* Ref.get(fixture.objects), leaseKey));
      assert.isTrue(HashMap.has(yield* Ref.get(fixture.objects), legacyKey));
    })
);

it.effect(
  "refuses a competing state reader while the first scope owns the stage lease",
  () =>
    Effect.scoped(
      Effect.gen(function* () {
        const fixture = yield* transport;
        const firstScope = yield* Scope.make();
        yield* Effect.addFinalizer(() => Scope.close(firstScope, Exit.void));
        const first = yield* makeAlchemyR2State(yield* config).pipe(
          Scope.provide(firstScope),
          Effect.provide(dependencies(fixture.client))
        );
        const address = {
          stack: "BundjilInfrastructure",
          stage: "preview",
          fqn: "LegacyResource",
        };
        yield* first.get(address);
        const second = yield* makeAlchemyR2State(yield* config).pipe(
          Effect.provide(dependencies(fixture.client))
        );
        const failure = yield* second.get(address).pipe(Effect.flip);
        assert.include(failure.message, "another deploy holds");
      })
    )
);
