import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateRequestSchema } from "@/api-helpers/utils";
import { OIDCResponseMode } from "@/types";
import { authenticate, authenticateSchema } from "@/lib/authenticate";
import { errorOIDCResponse } from "@/api-helpers/errors";

/**
 * Used for authentication directly from a mobile app.
 * Receives the ZKP from World ID-enabled mobile wallets, verifies with Developer Portal and returns redirect URI.
 * @param req
 * @param res
 * @returns
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, error } = await validateRequestSchema({
    schema: authenticateSchema,
    req,
    bodySource: "body",
  });

  if (parsedParams?.response_mode === OIDCResponseMode.FormPost) {
    return errorOIDCResponse(
      400,
      "invalid_response_mode",
      "This response mode is not valid for mobile authentication.",
      "response_mode"
    );
  }

  if (!isValid) {
    return errorOIDCResponse(400, error.code, error.detail, error.attr);
  }

  const result = await authenticate(parsedParams);

  if (!result.success) {
    return errorOIDCResponse(400, result.code, result.detail);
  }

  const redirect_uri = new URL(result.redirect_uri);

  if (parsedParams.response_mode === OIDCResponseMode.Query) {
    redirect_uri.search = result.url_params.toString();
  } else {
    redirect_uri.hash = result.url_params.toString();
  }

  return NextResponse.json({ redirect_uri });
};
