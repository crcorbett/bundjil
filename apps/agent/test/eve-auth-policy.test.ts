import { localDev, vercelOidc } from "eve/channels/auth";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";

import eveChannel from "../agent/channels/eve.js";

describe("Eve auth policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("authors the installed Vercel OIDC and localhost-only local development policy", () => {
    expect(eveChannel).toBeDefined();
    expect(
      localDev()(new Request("http://127.0.0.1/eve/v1/session"))
    ).not.toBeNull();
    expect(
      localDev()(new Request("https://bundjil-agent.vercel.app/eve/v1/session"))
    ).toBeNull();
  });

  it("rejects an anonymous deployed caller before an OIDC token is supplied", async () => {
    await expect(
      vercelOidc()(
        new Request("https://bundjil-agent.vercel.app/eve/v1/session")
      )
    ).resolves.toBeNull();
  });

  it("accepts a Vercel OIDC bearer for the deployed project", async () => {
    const team = `bundjil-${crypto.randomUUID()}`;
    const issuer = `https://oidc.vercel.com/${team}`;
    const audience = `https://vercel.com/${team}`;
    const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    const { privateKey, publicKey } = await generateKeyPair("RS256");
    const publicJwk = await exportJWK(publicKey);

    vi.stubEnv("VERCEL_PROJECT_ID", "prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN");
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    const fetch = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async (input) => {
        let url: string;
        if (typeof input === "string") {
          url = input;
        } else if (input instanceof URL) {
          url = input.href;
        } else {
          ({ url } = input);
        }

        if (url === discoveryUrl) {
          return Response.json({ issuer, jwks_uri: jwksUrl });
        }

        return Response.json({ keys: [{ ...publicJwk, kid: "bundjil" }] });
      });
    const token = await new SignJWT({
      environment: "production",
      owner: "cooper",
      owner_id: "team_1LX7ZujbijowTv8J9k0aU7nD",
      project: "bundjil-agent",
      project_id: "prj_Q8wOYPLsFFcGGKHlMf7XYgOxgimN",
    })
      .setProtectedHeader({ alg: "RS256", kid: "bundjil" })
      .setAudience(audience)
      .setExpirationTime("5m")
      .setIssuedAt()
      .setIssuer(issuer)
      .setSubject("owner:cooper:project:bundjil-agent:environment:production")
      .sign(privateKey);

    try {
      await expect(
        vercelOidc()(
          new Request("https://bundjil-agent.vercel.app/eve/v1/session", {
            headers: { authorization: `Bearer ${token}` },
          })
        )
      ).resolves.toMatchObject({
        authenticator: "oidc",
        principalType: "runtime",
      });
    } finally {
      fetch.mockRestore();
    }
  });
});
