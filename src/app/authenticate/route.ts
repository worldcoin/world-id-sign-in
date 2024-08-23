import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateRequestSchema } from "@/api-helpers/utils";
import { OIDCResponseMode } from "@/types";
import { authenticate, authenticateSchema } from "@/lib/authenticate";
import { internalRedirect } from "@/lib/utils";

function clean(string: string) {
  // used to sanitize values for the form post response mode
  return string
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user.
 * NOTE: This is an app internal endpoint (i.e. not called from other apps)
 * @param req
 * @param res
 * @returns
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, errorResponse } = await validateRequestSchema({
    schema: authenticateSchema,
    req,
    bodySource: "formData",
  });

  if (!isValid) {
    return errorResponse;
  }

  const result = await authenticate(parsedParams);

  if (!result.success) {
    const errorParams = new URLSearchParams({
      code: result.code,
      detail: result.detail,
      client_id: parsedParams.client_id,
      nonce: parsedParams.nonce!,
      response_type: parsedParams.response_type,
      ready: "true",
      redirect_uri: parsedParams.redirect_uri,
      scope: parsedParams.scope,
      state: parsedParams.state!,
      response_mode: parsedParams.response_mode!,
      code_challenge: parsedParams.code_challenge!,
      code_challenge_method: parsedParams.code_challenge_method!,
    });
    return internalRedirect(`/error?${errorParams.toString()}`, req.url);
  }

  const url = new URL(result.redirect_uri);

  if (parsedParams.response_mode === OIDCResponseMode.Query) {
    url.search = result.url_params.toString();
  } else if (parsedParams.response_mode === OIDCResponseMode.Fragment) {
    url.hash = result.url_params.toString();
  } else if (parsedParams.response_mode === OIDCResponseMode.FormPost) {
    const formHtml = `  
    <!DOCTYPE html>    
    <html>    
      <head>    
        <script>    
          function submitForm() {    
            document.getElementById("formRedirect").submit();    
          }    
        </script>    
      </head>    
      <body onload="submitForm()">    
        <form id="formRedirect" method="post" action="${url}">    
          ${Array.from(result.url_params.entries()).map(
            ([key, value]) =>
              `<input type="hidden" name="${clean(key)}" value="${clean(
                value
              )}" />`
          )}    
          <noscript>  
            <button type="submit">Submit</button>  
          </noscript>  
        </form>    
      </body>    
    </html>
    `;

    return new NextResponse(formHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.redirect(url, { status: 303 });
};
