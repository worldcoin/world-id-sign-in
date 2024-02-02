import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { validateRequestSchema } from "@/api-helpers/utils";
import { OIDCResponseMode } from "@/types";
import { authenticate, authenticateSchema } from "@/lib/authenticate";

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
    });
    return NextResponse.redirect(
      new URL(
        `${process.env.NEXT_PUBLIC_URL}/error?${errorParams.toString()}`,
        req.url
      ),
      { status: 302 }
    );
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
              `<input type="hidden" name="${key}" value="${value}" />`
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

  return NextResponse.redirect(url, { status: 302 });
};
