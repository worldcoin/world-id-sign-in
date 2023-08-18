import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import {
  OIDCResponseMode,
  OIDCResponseType,
  ValidationMessage,
  FlowType,
} from "@/types";
import { errorValidationClient } from "@/api-helpers/errors";
import * as yup from "yup";
import { validateRequestSchema } from "@/api-helpers/utils";

const SUPPORTED_SCOPES = ["openid", "profile", "email"];

// NOTE: List of valid response types for the code flow
// Source: https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth:~:text=Authorization%20Code%20Flow%2C-,this%20value%20is%20code.,-client_id
const CODE_FLOW_RESPONSE_TYPES = ["code"] as const;

// NOTE: List of valid response types for the implicit flow
// Source: https://openid.net/specs/openid-connect-core-1_0.html#ImplicitFlowAuth:~:text=this%20value%20is%20id_token%C2%A0token%20or%20id_token
const IMPLICIT_FLOW_RESPONSE_TYPES = ["id_token token", "id_token"] as const;

// NOTE: List of valid response types for the hybrid flow
// Source: https://openid.net/specs/openid-connect-core-1_0.html#HybridFlowAuth:~:text=this%20value%20is%20code%C2%A0id_token%2C%20code%C2%A0token%2C%20or%20code%C2%A0id_token%C2%A0token.
const HYBRID_FLOW_RESPONSE_TYPES = [
  "code id_token",
  "code token",
  "code id_token token",
] as const;

const RESPONSE_TYPES = [
  ...CODE_FLOW_RESPONSE_TYPES,
  ...IMPLICIT_FLOW_RESPONSE_TYPES,
  ...HYBRID_FLOW_RESPONSE_TYPES,
];

type ResponseType =
  | (typeof HYBRID_FLOW_RESPONSE_TYPES)[number]
  | (typeof IMPLICIT_FLOW_RESPONSE_TYPES)[number]
  | (typeof CODE_FLOW_RESPONSE_TYPES)[number];

function checkFlowType(responseType: string) {
  if (HYBRID_FLOW_RESPONSE_TYPES.some((type) => type === responseType)) {
    return FlowType.Hybrid;
  }

  if (CODE_FLOW_RESPONSE_TYPES.some((type) => type === responseType)) {
    return FlowType.AuthorizationCode;
  }

  if (IMPLICIT_FLOW_RESPONSE_TYPES.some((type) => type === responseType)) {
    return FlowType.Implicit;
  }

  return "Unknown Flow";
}

const schema = yup.object({
  response_type: yup
    .string()
    .strict()
    .required(ValidationMessage.Required)
    .test({
      name: "is-valid-response-type",
      message: "Invalid response type.",
      test: (value) => {
        const response_types = decodeURIComponent(value) as ResponseType;

        if (!RESPONSE_TYPES.includes(response_types as ResponseType)) {
          return false;
        }

        return true;
      },
    }),

  client_id: yup.string().strict().required(ValidationMessage.Required),
  redirect_uri: yup.string().strict().required(ValidationMessage.Required),

  scope: yup
    .string()
    .strict()
    .test({
      name: "is-valid-scope",
      message: "The requested scope is invalid, unknown, or malformed.",
      test: (value) => {
        if (!value) {
          return true;
        }

        const scopes = decodeURIComponent(value).split(" ");

        for (const scope of scopes) {
          if (!SUPPORTED_SCOPES.includes(scope)) {
            return false;
          }
        }

        return true;
      },
    }),

  state: yup.string(),

  nonce: yup.string().when("response_type", {
    // NOTE: we only require a nonce for the implicit flow
    is: (value: ResponseType) =>
      checkFlowType(decodeURIComponent(value)) === FlowType.Implicit,
    then: (field) => field.required(ValidationMessage.Required),
  }),

  response_mode: yup.string().strict(),
});

// FIXME: should we add a CSRF token to the request?
export const GET = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, errorResponse } = await validateRequestSchema({
    schema,
    req,
    bodySource: "query",
  });

  if (!isValid) {
    return errorResponse;
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    scope,
    state,
    nonce,
    response_mode,
  } = parsedParams;

  let url: URL | undefined;
  try {
    url = new URL(redirect_uri);
  } catch (err) {}

  if (!url) {
    return errorValidationClient(
      "invalid_request",
      "The redirect URI provided is missing or malformed.",
      "redirect_uri",
      req.url
    );
  }

  // ANCHOR: Verify the client id & redirect URI are valid
  const validateResponse = await fetch(
    `${DEVELOPER_PORTAL}/api/v1/oidc/validate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ app_id: client_id, redirect_uri }),
    }
  );

  if (!validateResponse.ok) {
    let errorDetails: Record<string, any> = {};
    try {
      errorDetails = await validateResponse.json();
    } catch (e) {
      console.error(
        `Error parsing response from Developer Portal (${validateResponse.status})`,
        e
      );
    }

    if (errorDetails.code === "not_found") {
      return errorValidationClient(
        "invalid_client_id",
        "Invalid client ID. Is your app registered in the Developer Portal? Please review and try again.",
        "client_id",
        req.url
      );
    }

    return errorValidationClient(
      errorDetails.code ?? "validation_error",
      errorDetails.detail ?? "Invalid request. Please review and try again.",
      errorDetails.attribute === "app_id"
        ? "client_id"
        : errorDetails.attribute,
      req.url
    );
  }

  if (scope) {
    const scopes = decodeURIComponent((scope as any).toString()).split(" ");

    for (const _scope of scopes) {
      if (!SUPPORTED_SCOPES.includes(_scope)) {
        return errorValidationClient(
          "invalid_scope",
          `The requested scope is invalid, unknown, or malformed. ${_scope} is not supported.`,
          "scope",
          req.url
        );
      }
    }
  }

  // TODO: Refactor with yup
  const responseTypesRaw = decodeURIComponent(
    (response_type as string | string[]).toString()
  ).split(" ");
  let responseTypes: OIDCResponseType[];
  try {
    responseTypes = responseTypesRaw.map((responseType) => {
      if (
        !(Object.values(OIDCResponseType) as string[]).includes(responseType)
      ) {
        throw new Error("Invalid response type.");
      } else {
        return responseType as OIDCResponseType;
      }
    });
  } catch {
    return errorValidationClient(
      "invalid_request",
      `Invalid response type`,
      "response_type",
      req.url
    );
  }

  let responseMode: OIDCResponseMode;
  if (response_mode) {
    if (
      !(Object.values(OIDCResponseMode) as string[]).includes(
        response_mode as string
      )
    ) {
      return errorValidationClient(
        "invalid_request",
        `Invalid response mode: ${response_mode}.`,
        "response_mode",
        req.url
      );
    } else {
      responseMode = response_mode as OIDCResponseMode;

      //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#Combinations
      //  REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html#id_token
      //  To prevent access token leakage we also prevent `query` mode when requesting only an access token (OAuth 2.0 flow)
      if (
        responseMode === OIDCResponseMode.Query &&
        (responseTypes.includes(OIDCResponseType.Token) ||
          responseTypes.includes(OIDCResponseType.IdToken))
      ) {
        return errorValidationClient(
          "invalid_request",
          `Invalid response mode: ${response_mode}. For response type ${response_type}, query is not supported for security reasons.`,
          "response_mode",
          req.url
        );
      }
    }
  } else {
    // REFERENCE: https://openid.net/specs/oauth-v2-multiple-response-types-1_0.html
    switch (response_type) {
      case OIDCResponseType.Code:
        responseMode = OIDCResponseMode.Query;
        break;
      default:
        responseMode = OIDCResponseMode.Fragment;
    }
  }

  const params = new URLSearchParams({
    response_type,
    response_mode: responseMode,
    client_id,
    redirect_uri,
    nonce: nonce || new Date().getTime().toString(), // NOTE: given the nature of our proofs, if a nonce is not passed, we generate one
    // TODO: should enforce one time use for nonces
    ready: "true", // for UX purposes, to avoid users getting to the login page without verifying their request
  });

  if (scope) params.append("scope", scope.toString());
  if (state) params.append("state", state.toString());

  return NextResponse.redirect(
    new URL(`/login?${params.toString()}`, req.url),
    { status: 302 }
  );
};
