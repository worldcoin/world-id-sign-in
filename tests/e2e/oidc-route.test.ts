import { POST as handlerOIDCRoute } from "@/app/oidc-route/route";
import { NextRequest } from "next/server";
import { AUTHENTICATE_MOCK } from "../__mocks__/authenticate.mock";
import { POST } from "@/app/authenticate/route";

describe("e2e OIDC tests", () => {
  test("can request and verify JWT token", async () => {
    // ANCHOR: Generate the token
    const formData = new FormData();

    for (const key of Object.keys(AUTHENTICATE_MOCK)) {
      formData.append(key, AUTHENTICATE_MOCK[key]);
    }

    // TODO: A fresh ZKP must be generated locally for this to work end-to-end
    return;

    const authenticateReq = new NextRequest("http://localhost/authenticate", {
      method: "POST",
      body: formData,
    });
    const authenticateResponse = await POST(authenticateReq);
    expect(authenticateResponse.status).toBe(303);

    const redirectUrl = new URL(authenticateResponse.headers.get("location")!);
    console.log(redirectUrl);
    const token = redirectUrl.searchParams.get("token");
    expect(token).toBeTruthy();

    // ANCHOR: /introspect
    const auth = Buffer.from(
      `${AUTHENTICATE_MOCK.client_id}:${process.env.E2E_TEST_APP_CLIENT_SECRET}`
    ).toString("base64");
    const introspectReq = new NextRequest("http://localhost/introspect", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
        authorization: `Basic ${auth}`,
      }),
      body: new URLSearchParams({
        token: token!,
      }),
    });

    const introspectResponse = await handlerOIDCRoute(introspectReq);
    expect(introspectResponse.status).toBe(200);

    const introspectJson = await introspectResponse.json();
    expect(introspectJson.active).toBe(true);
    expect(introspectJson.client_id).toBe(
      "app_staging_cb4113a6f4f9dcd1f6cd6e05377dd614"
    );
    expect(introspectJson.exp).toBeGreaterThan(new Date().getDate());

    // ANCHOR: /userinfo
    const userInfoReq = new NextRequest("http://localhost/userinfo", {
      method: "GET",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
        authorization: `Bearer ${token}`,
      }),
    });

    const userInfoResponse = await handlerOIDCRoute(userInfoReq);
    expect(userInfoResponse.status).toBe(200);

    const userInfoJson = await userInfoResponse.json();
    expect(userInfoJson).toEqual({
      sub: expect.stringMatching(/^0x[a-f0-9]{64}$/),
      "https://id.worldcoin.org/beta": {
        likely_human: "strong",
        credential_type: "orb",
      },
      "https://id.worldcoin.org/v1": {
        verification_level: "orb",
      },
    });
  });

  test("can request and verify auth token", async () => {
    // ANCHOR: Generate the token
    const formData = new FormData();

    for (const key of Object.keys(AUTHENTICATE_MOCK)) {
      formData.append(key, AUTHENTICATE_MOCK[key]);
    }

    // TODO: A fresh ZKP must be generated locally for this to work end-to-end
    return;

    const authenticateReq = new NextRequest("http://localhost/authenticate", {
      method: "POST",
      body: formData,
    });
    const authenticateResponse = await POST(authenticateReq);
    expect(authenticateResponse.status).toBe(303);

    const redirectUrl = new URL(authenticateReq.headers.get("location")!);
    const code = redirectUrl.searchParams.get("code");
    expect(code).toBeTruthy();

    const auth = Buffer.from(
      `${AUTHENTICATE_MOCK.client_id}:${process.env.E2E_TEST_APP_CLIENT_SECRET}`
    ).toString("base64");

    const req = new NextRequest("http://localhost/token", {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/x-www-form-urlencoded",
        authorization: `Basic ${auth}`,
      }),
      body: new URLSearchParams({
        code: code!,
        grant_type: "authorization_code",
      }),
    });

    const response = await handlerOIDCRoute(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toEqual(
      expect.objectContaining({
        access_token: expect.any(String),
        token_type: "Bearer",
        expires_in: 3600,
        scope: expect.any(String),
        id_token: expect.any(String),
      })
    );
  });

  test("can fetch JWKs", async () => {
    const req = new NextRequest("http://localhost/jwks.json");

    const authenticateResponse = await handlerOIDCRoute(req);
    expect(authenticateResponse.status).toBe(200);

    const json = await authenticateResponse.json();

    expect(json.keys.length).toBeGreaterThanOrEqual(1);
    expect(json.keys[0]).toEqual(
      expect.objectContaining({
        e: "AQAB",
        n: expect.any(String),
        kty: "RSA",
        kid: expect.stringMatching(/^jwk_/),
      })
    );
  });
});
