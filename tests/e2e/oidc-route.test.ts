import { POST as handlerOIDCRoute } from "@/app/oidc-route/route";
import { NextRequest, NextResponse } from "next/server";
import { AUTHENTICATE_MOCK } from "./authenticate.mock";
import { POST as handlerAuthenticate } from "@/app/authenticate/route";
import { GET } from "@/app/authorize/route";

const defaultAuthorizeParams: Record<string, string> = {
  client_id: AUTHENTICATE_MOCK.client_id,
  redirect_uri: AUTHENTICATE_MOCK.redirect_uri,
  nonce: AUTHENTICATE_MOCK.nonce,
};

const testAuthorize = async (
  params: Record<string, string>
): Promise<NextResponse> => {
  const searchParams = new URLSearchParams({
    ...defaultAuthorizeParams,
    ...params,
  });
  const authorizeReq = new NextRequest(
    `http://localhost/authorize?${searchParams.toString()}`
  );
  return await GET(authorizeReq);
};


describe("e2e OIDC tests", () => {
  const responseTypes = ["code", "id_token", "token", "code id_token"];
  const responseModes = ["query", "fragment", "form_post"];

  for (const responseType of responseTypes) {
    for (const responseMode of responseModes) {
      test(`Authorize request (${responseMode}) with response type: ${responseType}`, async () => {
        const params = {
          response_type: responseType,
          response_mode: responseMode,
        };
        const response = await testAuthorize(params);

        // Check if status is 302 Found (redirection)
        expect(response.status).toBe(302);

        const redirectUrl = new URL(response.headers.get("location")!);

        // Check returned URL has correct search parameters
        const expectedKeys = responseType
          .split(" ")
          .map((type) => (type === "code" ? "code" : "token"));
        const urlParams = new URLSearchParams(redirectUrl.search);
        const urlHashParams = new URLSearchParams(redirectUrl.hash.slice(1));

        // Validate the response with the correct search parameters depending on the response mode
        if (responseMode === "query") {
          expectedKeys.forEach((key) => {
            expect(urlParams.has(key)).toBeTruthy();
          });
          expect(redirectUrl.hash).toBe("");
        } else if (responseMode === "fragment") {
          expectedKeys.forEach((key) => {
            expect(urlHashParams.has(key)).toBeTruthy();
          });
          expect(redirectUrl.search).toBe("");
        } else if (responseMode === "form_post") {
          expect(response.headers.get("content-type")).toEqual(
            "text/html; charset=utf-8"
          );
          const formHtml = await response.text();
          expect(formHtml).toMatch(
            /<input type="hidden" name=".+?" value=".+?" \/>/
          );
        }
      });
    }
  }

  const invalidCombinations = [
    { response_type: "code", response_mode: "fragment" },
    { response_type: "id_token", response_mode: "query" },
    { response_type: "token", response_mode: "query" },
    { response_type: "code id_token", response_mode: "query" },
    { response_type: "code id_token token", response_mode: "query" },
    { response_type: "id_token code", response_mode: "query" },
  ];

  for (const { response_type, response_mode } of invalidCombinations) {
    test(`Authorize request with invalid combination response_type: ${response_type}, response_mode: ${response_mode}`, async () => {
      const params = { response_type, response_mode };
      const response = await testAuthorize(params);

      // Check if status is 400 Bad Request
      expect(response.status).toBe(400);

      // Ensure error details are provided for the validation error
      const errorDetails = await response.json();
      expect(errorDetails).toHaveProperty("code");
      expect(errorDetails).toHaveProperty("detail");
      expect(errorDetails).toHaveProperty("attribute");
    });
  }

  test("can request and verify JWT token", async () => {
    // ANCHOR: Generate the token
    const authenticateReq = new NextRequest("http://localhost/authenticate", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(AUTHENTICATE_MOCK),
    });

    const authenticateResponse = await handlerAuthenticate(authenticateReq);
    expect(authenticateResponse.status).toBe(302);

    const redirectUrl = new URL(authenticateResponse.headers.get("location")!);
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
    });
  });

  test("can request and verify auth token", async () => {
    // ANCHOR: Generate the token
    const authenticateReq = new NextRequest("http://localhost/authenticate", {
      method: "POST",
      headers: new Headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        ...AUTHENTICATE_MOCK,
        response_type: "code",
      }),
    });

    const authenticateResponse = await handlerAuthenticate(authenticateReq);
    expect(authenticateResponse.status).toBe(302);

    const redirectUrl = new URL(authenticateResponse.headers.get("location")!);
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

  test("can fetch OIDC config", async () => {
    const req = new NextRequest(
      "http://localhost/.well-known/openid-configuration"
    );

    const authenticateResponse = await handlerOIDCRoute(req);
    expect(authenticateResponse.status).toBe(200);

    const json = await authenticateResponse.json();

    expect(json.issuer).toEqual("https://id.worldcoin.org");
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
