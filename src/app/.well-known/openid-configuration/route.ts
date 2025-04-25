import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { errorNotAllowed } from "@/api-helpers/errors";
import { OIDC_BASE_URL } from "@/consts";
import { OIDCScope } from "@/types";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  if (!req.method || !["GET", "OPTIONS"].includes(req.method)) {
    return errorNotAllowed(req.method);
  }

  return NextResponse.json({
    issuer: OIDC_BASE_URL,
    jwks_uri: `${OIDC_BASE_URL}/jwks.json`,
    token_endpoint: `${OIDC_BASE_URL}/token`,
    code_challenge_methods_supported: ["S256"],
    scopes_supported: Object.values(OIDCScope),
    id_token_signing_alg_values_supported: ["RSA"],
    userinfo_endpoint: `${OIDC_BASE_URL}/userinfo`,
    authorization_endpoint: `${OIDC_BASE_URL}/authorize`,
    grant_types_supported: ["authorization_code", "implicit"],
    service_documentation: "https://docs.worldcoin.org/id/sign-in",
    op_policy_uri: "https://developer.worldcoin.org/privacy-statement",
    op_tos_uri: "https://developer.worldcoin.org/tos",
    subject_types_supported: ["pairwise"], // subject is unique to each application, cannot be used across apps
    response_modes_supported: ["query", "fragment", "form_post"],
    response_types_supported: [
      "code", // Authorization code flow
      "id_token", // Implicit flow
      "id_token token", // Implicit flow
      "code id_token", // Hybrid flow
    ],
  });
};
