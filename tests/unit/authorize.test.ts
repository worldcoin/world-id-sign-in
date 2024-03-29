import { NextRequest, NextResponse } from "next/server";
import { GET } from "@/app/authorize/route";
import fetchMock from "jest-fetch-mock";

import {
  AUTHENTICATE_MOCK,
  AUTHORIZE_CODE_RESPONSE_TYPES,
  HYBRID_RESPONSE_TYPES,
  IMPLICIT_RESPONSE_TYPES,
} from "tests/__mocks__/authenticate.mock";

import { OIDCResponseMode } from "@/types";
import { OIDCErrorCodes } from "@/api-helpers/errors";

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
  const searchParams = new URLSearchParams(params);

  const authorizeReq = new NextRequest(
    `http://localhost/authorize?${searchParams.toString()}`
  );

  return await GET(authorizeReq);
};

describe("/authorize response_types and response_modes", () => {
  const validTestCases = [
    // Authorization Code Flow
    ...AUTHORIZE_CODE_RESPONSE_TYPES.map((responseType) => ({
      responseType,
      responseModes: [
        OIDCResponseMode.Query,
        OIDCResponseMode.Fragment,
        OIDCResponseMode.FormPost,
      ],
    })),

    // Implicit Flow
    ...IMPLICIT_RESPONSE_TYPES.map((responseType) => ({
      responseType,
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    })),

    // Hybrid Flow
    ...HYBRID_RESPONSE_TYPES.map((responseType) => ({
      responseType,
      responseModes: [OIDCResponseMode.Fragment, OIDCResponseMode.FormPost],
    })),

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

        const response = await testAuthorize({
          ...defaultAuthorizeParams,
          ...params,
        });

        // Check if status is 303 See Other (redirection)
        expect(response.status).toBe(303);
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

      const response = await testAuthorize({
        ...defaultAuthorizeParams,
        ...params,
      });

      // Check if status is 303 See Other (redirection)
      // NOTE: Errors are rendered to the user in the /error page
      expect(response.status).toBe(303);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/error");
      expect(redirectUrl.searchParams.get("code")).toEqual("invalid_request");

      expect(redirectUrl.searchParams.get("detail")).toEqual(
        `Invalid response mode: ${response_mode}. For response type ${response_type}, query is not supported for security reasons.`
      );
    });
  }
});

describe("/authorize nonce", () => {
  const responseTypesWithNonce = IMPLICIT_RESPONSE_TYPES;

  const responseTypesWithoutNonce = [
    ...AUTHORIZE_CODE_RESPONSE_TYPES,
    ...HYBRID_RESPONSE_TYPES,
  ];

  for (const response_type of responseTypesWithNonce) {
    test(`Nonce required for implicit flow | response_type: ${response_type}`, async () => {
      const params = {
        response_type,
        response_mode: OIDCResponseMode.Fragment,
      };

      const response = await testAuthorize({
        ...defaultAuthorizeParams,
        ...params,
      });

      expect(response.status).toBe(303);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/login");

      expect(redirectUrl.searchParams.get("response_mode")).toEqual(
        OIDCResponseMode.Fragment
      );

      expect(redirectUrl.searchParams.get("response_type")).toEqual(
        response_type
      );

      expect(redirectUrl.searchParams.get("ready")).toEqual("true");
    });
  }

  for (const response_type of responseTypesWithNonce) {
    test(`Missing nonce error for implicit flow | response_type: ${response_type}`, async () => {
      const defaultParams = { ...defaultAuthorizeParams };
      delete defaultParams.nonce;

      const params = {
        response_type,
        response_mode: OIDCResponseMode.Fragment,
      };

      const response = await testAuthorize({
        ...defaultParams,
        ...params,
      });

      expect(response.status).toBe(303);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/error");

      expect(redirectUrl.searchParams.get("code")).toEqual(
        OIDCErrorCodes.InvalidRequest
      );

      expect(redirectUrl.searchParams.get("detail")).toEqual(
        "This attribute is required"
      );

      expect(redirectUrl.searchParams.get("attribute")).toEqual("nonce");
    });
  }

  for (const response_type of responseTypesWithoutNonce) {
    test(`Non-implicit flow works without nonce | response_type: ${response_type}`, async () => {
      const defaultParams = { ...defaultAuthorizeParams };
      delete defaultParams.nonce;

      const params = {
        response_type,
        response_mode: OIDCResponseMode.Fragment,
      };

      const response = await testAuthorize({
        ...defaultParams,
        ...params,
      });

      expect(response.status).toBe(303);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/login");

      expect(redirectUrl.searchParams.get("response_mode")).toEqual(
        OIDCResponseMode.Fragment
      );

      expect(redirectUrl.searchParams.get("response_type")).toEqual(
        response_type
      );

      expect(redirectUrl.searchParams.get("ready")).toEqual("true");
    });
  }
});

describe("/authorize default response_modes", () => {
  test("default response_mode for authorization flow is query", async () => {
    const params = {
      ...defaultAuthorizeParams,
      response_type: "code",
    };
    // @ts-expect-error sanity check to make sure it's not set by default
    expect(params.response_mode).toBeUndefined();

    const response = await testAuthorize(params);

    expect(response.status).toEqual(303);
    const redirectUrl = new URL(response.headers.get("location")!);
    expect(redirectUrl.pathname).toEqual("/login");
    expect(redirectUrl.searchParams.get("response_mode")).toEqual("query");
  });

  test("default response_mode for non-authorization flow is form_post", async () => {
    const nonAuthorizationCodeOptions = [
      "code token",
      "code id_token",
      "id_token token",
      "code id_token token",
      "id_token",
      "token",
    ];

    for (const response_type of nonAuthorizationCodeOptions) {
      const params = {
        ...defaultAuthorizeParams,
        response_type,
      };
      // @ts-expect-error sanity check to make sure it's not set by default
      expect(params.response_mode).toBeUndefined();

      const response = await testAuthorize(params);

      expect(response.status).toEqual(303);
      const redirectUrl = new URL(response.headers.get("location")!);
      expect(redirectUrl.pathname).toEqual("/login");
      expect(redirectUrl.searchParams.get("response_mode")).toEqual("fragment");
    }
  });
});

describe("/authorize PKCE params", () => {
  test("invalid code_challenge_method is rejected", async () => {
    const params = {
      ...defaultAuthorizeParams,
      response_type: "code",
      code_challenge_method: "R256",
      code_challenge: "123",
    };

    const response = await testAuthorize(params);

    expect(response.status).toEqual(303);
    const redirectUrl = new URL(response.headers.get("location")!);
    expect(redirectUrl.pathname).toEqual("/error");
    expect(redirectUrl.searchParams.get("code")).toEqual("invalid_request");
    expect(redirectUrl.searchParams.get("detail")).toEqual(
      "Invalid code_challenge_method: R256."
    );
  });

  test("missing code_challenge_method on PKCE flow is rejected", async () => {
    const params = {
      ...defaultAuthorizeParams,
      response_type: "code",
      code_challenge: "123",
    };

    const response = await testAuthorize(params);

    expect(response.status).toEqual(303);
    const redirectUrl = new URL(response.headers.get("location")!);
    expect(redirectUrl.pathname).toEqual("/error");
    expect(redirectUrl.searchParams.get("code")).toEqual("invalid_request");
    expect(redirectUrl.searchParams.get("attribute")).toEqual(
      "code_challenge_method"
    );
  });

  test("missing code_challenge on PKCE flow is rejected", async () => {
    const params = {
      ...defaultAuthorizeParams,
      response_type: "code",
      code_challenge_method: "S256",
    };

    const response = await testAuthorize(params);

    expect(response.status).toEqual(303);
    const redirectUrl = new URL(response.headers.get("location")!);
    expect(redirectUrl.pathname).toEqual("/error");
    expect(redirectUrl.searchParams.get("code")).toEqual("invalid_request");
    expect(redirectUrl.searchParams.get("detail")).toEqual(
      "This attribute is required when code_challenge_method is provided (PKCE)."
    );
    expect(redirectUrl.searchParams.get("attribute")).toEqual("code_challenge");
  });
});
