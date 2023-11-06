import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import * as yup from "yup";
import { validateRequestSchema } from "@/api-helpers/utils";
import { OIDCResponseMode, ValidationMessage } from "@/types";
import { OIDCResponseModeValidation } from "@/api-helpers/validation";

const schema = yup.object({
  proof: yup.string().required(ValidationMessage.Required),
  nullifier_hash: yup.string().required(ValidationMessage.Required),
  merkle_root: yup.string().required(ValidationMessage.Required),
  credential_type: yup.string().required(ValidationMessage.Required),
  client_id: yup.string().required(ValidationMessage.Required),
  nonce: yup.string().required(ValidationMessage.Required), // NOTE: While technically not required by the OIDC spec, we require it as a security best practice
  scope: yup.string().required("The openid scope is always required."), // NOTE: Content verified in the Developer Portal
  state: yup.string(),
  response_type: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
  response_mode: OIDCResponseModeValidation,
  redirect_uri: yup.string().required(ValidationMessage.Required), // NOTE: Content verified in the Developer Portal
  code_challenge: yup.string(), // NOTE: Content verified in the Developer Portal
  code_challenge_method: yup.string(), // NOTE: Content verified in the Developer Portal
});

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user.
 * NOTE: This is an app internal endpoint (i.e. not called directly from other apps)
 * @param req
 * @param res
 * @returns
 */
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const { parsedParams, isValid, errorResponse } = await validateRequestSchema({
    schema,
    req,
    bodySource: "formData",
  });

  if (!isValid) {
    return errorResponse;
  }

  const {
    state,
    response_type,
    response_mode,
    client_id,
    redirect_uri,
    nonce,
    proof,
    scope,
    merkle_root,
    nullifier_hash,
    credential_type,
    code_challenge,
    code_challenge_method,
  } = parsedParams;

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      proof,
      scope,
      merkle_root,
      redirect_uri,
      response_type,
      signal: nonce,
      nullifier_hash,
      code_challenge,
      credential_type,
      app_id: client_id,
      code_challenge_method,
    }),
  });

  if (!response.ok) {
    let errorResponse;
    let responseClone = response.clone();
    try {
      errorResponse = await response.json();
    } catch {
      errorResponse = await responseClone.text();
    }

    console.error(
      `Could not authenticate OIDC user: ${response.statusText}`,
      errorResponse
    );

    const detail = Object.hasOwn(errorResponse, "detail")
      ? errorResponse.detail
      : "We could not complete your authentication. Please try again.";

    const searchParams = new URLSearchParams({
      scope,
      detail,
      response_type,
      response_mode,
      client_id,
      redirect_uri,
      code: "authentication_failed",
      nonce,
    });

    if (state) {
      searchParams.append("state", state.toString());
    }

    return NextResponse.redirect(
      new URL(`/error?${searchParams.toString()}`, req.url),
      { status: 302 }
    );
  }

  const responseAuth = await response.json();

  const url = new URL(redirect_uri!.toString());
  let urlParams = new URLSearchParams();
  if (responseAuth.code) urlParams.append("code", responseAuth.code);
  if (responseAuth.token) urlParams.append("token", responseAuth.token);
  if (responseAuth.id_token)
    urlParams.append("id_token", responseAuth.id_token);

  // FIXME: pass `state` in a secure cookie (signed) from original request to prevent tampering
  if (state) urlParams.append("state", state.toString());

  if (response_mode === OIDCResponseMode.Query) {
    url.search = urlParams.toString();
  } else if (response_mode === OIDCResponseMode.Fragment) {
    url.hash = urlParams.toString();
  } else if (response_mode === OIDCResponseMode.FormPost) {
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
          ${Array.from(urlParams.entries()).map(
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
