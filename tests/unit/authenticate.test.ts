import { NextRequest, NextResponse } from "next/server";
import { POST } from "@/app/authenticate/route";
import fetchMock from "jest-fetch-mock";
import { AUTHENTICATE_MOCK } from "tests/__mocks__/authenticate.mock";
import { OIDCResponseMode, OIDCResponseType } from "@/types";

beforeAll(() => {
  fetchMock.enableMocks();
  fetchMock.mockIf(/\/api\/v1\/oidc\/authorize/, async (req) => {
    const response = {} as Record<string, string>;

    const json = await req.json();

    if (json.response_type.includes(OIDCResponseType.Code)) {
      response.code = "abcdefgh";
    }

    if (json.response_type.includes(OIDCResponseType.IdToken)) {
      response.id_token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.L8i6g3PfcHlioHCCPURC9pmXT7gdJpx3kOoyAfNUwCc";
    }

    if (json.response_type.includes(OIDCResponseType.Token)) {
      response.token =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.L8i6g3PfcHlioHCCPURC9pmXT7gdJpx3kOoyAfNUwCc";
    }

    return JSON.stringify(response);
  });
});

const testAuthenticate = async (
  params: Record<string, string | null | undefined>
): Promise<NextResponse> => {
  const formData = new FormData();
  const mergedParams = { ...AUTHENTICATE_MOCK, ...params };
  for (const key of Object.keys(mergedParams)) {
    const value = mergedParams[key];
    if (value) {
      formData.append(key, value);
    }
  }
  const authenticateReq = new NextRequest(`http://localhost/authorize`, {
    method: "POST",
    body: formData,
  });
  return await POST(authenticateReq);
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
        const response = await testAuthenticate(params);

        if (responseMode === OIDCResponseMode.FormPost) {
          expect(response.status).toEqual(200);
          expect(response.headers.get("content-type")).toEqual(
            "text/html; charset=utf-8"
          );
          const formHtml = await response.text();
          expect(formHtml).toMatch(
            /<input type="hidden" name=".+?" value=".+?" \/>/
          );
        } else {
          expect(response.status).toEqual(302);
          const redirectUrl = new URL(response.headers.get("location")!);
          const expectedKeys = testCase.responseType.split(" ");
          const urlParams = new URLSearchParams(redirectUrl.search);
          const urlHashParams = new URLSearchParams(redirectUrl.hash.slice(1));

          if (responseMode === OIDCResponseMode.Query) {
            expectedKeys.forEach((key) => {
              expect(urlParams.has(key)).toBeTruthy();
            });
            expect(redirectUrl.hash).toBe("");
          } else {
            expectedKeys.forEach((key) => {
              expect(urlHashParams.has(key)).toBeTruthy();
            });
            expect(redirectUrl.search).toBe("");
          }
        }
      });
    }
  }
});

describe("/authorize PKCE mode", () => {
  test("passes PKCE params and params are not sent back in response", async () => {
    const params = {
      code_challenge_method: "S256",
      code_challenge: "test_hash_123",
    };

    fetchMock.mockIf(/\/api\/v1\/oidc\/authorize/, async (req) => {
      const json = await req.json();
      expect(json.code_challenge_method).toEqual("S256");
      expect(json.code_challenge).toEqual("test_hash_123");
      return JSON.stringify({ code: "12345678" });
    });

    const response = await testAuthenticate(params);

    expect(response.status).toEqual(302);
    const redirectUrl = new URL(response.headers.get("location")!);
    expect(redirectUrl.searchParams.get("code_challenge_method")).toBeNull();
    expect(redirectUrl.searchParams.get("code_challenge")).toBeNull();
  });
});
