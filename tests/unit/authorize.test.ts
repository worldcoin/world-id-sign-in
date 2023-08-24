import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/authorize/route";
import fetchMock from "jest-fetch-mock";
import { AUTHENTICATE_MOCK } from "tests/__mocks__/authenticate.mock";
import { OIDCResponseMode } from "@/types";

beforeAll(() => {
  fetchMock.enableMocks();
  fetchMock.mockIf(/\/api\/v1\/oidc\/validate/).mockResponse(
    JSON.stringify({
      app_id: AUTHENTICATE_MOCK.client_id,
      redirect_uri: AUTHENTICATE_MOCK.redirect_uri,
    })
  );
});

const defaultAuthorizeParams: Record<string, string> = {
  client_id: AUTHENTICATE_MOCK.client_id,
  redirect_uri: AUTHENTICATE_MOCK.redirect_uri,
  nonce: AUTHENTICATE_MOCK.nonce,
  scope: AUTHENTICATE_MOCK.scope,
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

describe("/authorize response_types and response_modes", () => {
  const validTestCases = [
    {
      responseType: "code", // Authorization Code Flow
      responseModes: [
        OIDCResponseMode.Query,
        OIDCResponseMode.Fragment,
        OIDCResponseMode.FormPost,
      ],
    },
    {
      responseType: "id_token", // Implicit Flow
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
    {
      responseType: "id_token token", // Implicit Flow
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
    {
      responseType: "code id_token", // Hybrid Flow
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
    {
      responseType: "code token", // Hybrid Flow
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
    {
      responseType: "code id_token token", // Hybrid Flow
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
    {
      responseType: "token", // Not directly part of OIDC (OAuth 2.0)
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    },
  ];

  for (const testCase of validTestCases) {
    for (const responseMode of testCase.responseModes) {
      test(`Authorize request (${responseMode}) with response type: ${testCase.responseType}`, async () => {
        const params = {
          response_type: testCase.responseType,
          response_mode: responseMode,
        };
        const response = await testAuthorize(params);

        // Check if status is 302 Found (redirection)
        expect(response.status).toBe(302);

        const redirectUrl = new URL(response.headers.get("location")!);
        expect(redirectUrl.pathname).toEqual("/login");
        expect(redirectUrl.searchParams.get("response_mode")).toEqual(
          responseMode
        );
        expect(redirectUrl.searchParams.get("response_type")).toEqual(
          testCase.responseType
        );
        expect(redirectUrl.searchParams.get("ready")).toEqual("true");
      });
    }
  }

  const invalidCombinations = [
    // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#Combinations
    { response_type: "code token", response_mode: "query" },
    { response_type: "code id_token", response_mode: "query" },
    { response_type: "id_token token", response_mode: "query" },
    { response_type: "code id_token token", response_mode: "query" },

    // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#id_token
    { response_type: "id_token", response_mode: "query" },

    // Related to: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics#section-4.3.2
    { response_type: "token", response_mode: "query" },
  ];

  for (const { response_type, response_mode } of invalidCombinations) {
    test(`Authorize request with invalid combination response_type: ${response_type}, response_mode: ${response_mode}`, async () => {
      const params = { response_type, response_mode };
      const response = await testAuthorize(params);

      // Check if status is 302 Found (redirection)
      // NOTE: Errors are rendered to the user in the /error page
      expect(response.status).toBe(302);

      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/error");

      expect(redirectUrl.searchParams.get("code")).toEqual("invalid_request");
      expect(redirectUrl.searchParams.get("detail")).toEqual(
        `Invalid response mode: ${response_mode}. For response type ${response_type}, query is not supported for security reasons.`
      );
    });
  }
});
