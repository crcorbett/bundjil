import { Credentials, Endpoint, Region } from "@distilled.cloud/aws";
import { it, assert } from "@effect/vitest";
import { AWSEnvironment, makeS3State } from "alchemy/AWS";
import { Effect, Layer, Redacted } from "effect";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientResponse from "effect/http/HttpClientResponse";

const credentials = Effect.succeed({
  sessionToken: undefined,
  region: "auto",
  accessKeyId: Redacted.make("synthetic-access-key"),
  secretAccessKey: Redacted.make("synthetic-secret-key"),
});
const environment = Layer.mergeAll(
  Layer.succeed(Credentials.Credentials, credentials),
  Layer.succeed(Region.Region, Effect.succeed("auto")),
  Layer.succeed(
    Endpoint.Endpoint,
    Effect.succeed("https://state.example.invalid")
  ),
  Layer.succeed(
    AWSEnvironment,
    Effect.succeed({
      accountId: "synthetic-account",
      region: "auto",
      credentials,
      endpoint: "https://state.example.invalid",
    })
  )
);

it.effect("reads legacy R2 state without changing bucket settings", () =>
  Effect.gen(function* () {
    const requests: string[] = [];
    const client = HttpClient.make((request) =>
      Effect.sync(() => {
        const path = new URL(request.url).pathname;
        requests.push(`${request.method} ${path}`);
        assert.strictEqual(
          new URL(request.url).search,
          request.method === "HEAD" ? "" : "?x-id=GetObject"
        );
        assert.isTrue(request.method === "HEAD" || request.method === "GET");
        return HttpClientResponse.fromWeb(
          request,
          new Response(
            request.method === "HEAD"
              ? null
              : '{"resourceType":"bundjil::SyntheticResource","fqn":"RetainedResource","logicalId":"RetainedResource","instanceId":"retained-instance","providerVersion":1,"status":"updated","downstream":[],"bindings":[],"props":{"stage":"preview"},"attr":{"identity":"retained-physical"},"removalPolicy":"retain"}',
            { status: 200, headers: { "content-type": "application/json" } }
          )
        );
      })
    );
    const state = yield* makeS3State({
      bucketName: "bundjil-alchemy-state",
      prefix: "bundjil/v1",
      manageBucket: false,
    }).pipe(
      Effect.provide(
        Layer.merge(environment, Layer.succeed(HttpClient.HttpClient, client))
      )
    );
    assert.deepStrictEqual(requests, []);
    const value = yield* state.get({
      stack: "bundjil",
      stage: "preview",
      fqn: "RetainedResource",
    });
    assert.deepInclude(value, {
      logicalId: "RetainedResource",
      removalPolicy: "retain",
      attr: { identity: "retained-physical" },
    });
    assert.deepStrictEqual(requests, [
      "HEAD /bundjil-alchemy-state",
      "GET /bundjil-alchemy-state/bundjil/v1/bundjil/preview/RetainedResource.json",
    ]);
  })
);

it.effect("fails on an absent managed R2 bucket without creating it", () =>
  Effect.gen(function* () {
    const methods: string[] = [];
    const client = HttpClient.make((request) =>
      Effect.sync(() => {
        methods.push(request.method);
        return HttpClientResponse.fromWeb(
          request,
          new Response(null, { status: 404 })
        );
      })
    );
    const state = yield* makeS3State({
      bucketName: "bundjil-alchemy-state",
      prefix: "bundjil/v1",
      manageBucket: false,
    }).pipe(
      Effect.provide(
        Layer.merge(environment, Layer.succeed(HttpClient.HttpClient, client))
      )
    );
    const result = yield* Effect.result(
      state.get({ stack: "bundjil", stage: "preview", fqn: "RetainedResource" })
    );
    assert.strictEqual(result._tag, "Failure");
    assert.deepStrictEqual(methods, ["HEAD"]);
  })
);
