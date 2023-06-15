import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { DEVELOPER_PORTAL } from "@/consts";
import { errorRequiredAttribute } from "@/api-helpers/errors";

const params = [
  "response_type",
  "client_id",
  "redirect_uri",
  "nonce",
  "merkle_root",
  "proof",
  "credential_type",
  "nullifier_hash",
];

/**
 * Receives the ZKP from the frontend, verifies with Developer Portal and redirects the user
 * @param req
 * @param res
 * @returns
 */
export const handlerAuthenticate = async (
  req: NextRequest
): Promise<NextResponse> => {
  for (const attr of params) {
    if (!req.nextUrl.searchParams.get(attr)) {
      return errorRequiredAttribute(attr);
    }
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    nonce,
    merkle_root,
    proof,
    credential_type,
    nullifier_hash,
    state,
    scope,
  } = Object.fromEntries(req.nextUrl.searchParams.entries());

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      response_type,
      app_id: client_id,
      redirect_uri,
      nonce,
      merkle_root,
      proof,
      credential_type,
      nullifier_hash,
      scope,
    }),
  });

  if (!response.ok) {
    let errorResponse;
    try {
      errorResponse = await response.json();
    } catch {
      errorResponse = await response.text();
    }

    console.error(
      `Could not authenticate OIDC user: ${response.statusText}`,
      errorResponse
    );

    const detail = Object.hasOwn(errorResponse, "detail")
      ? errorResponse.detail
      : "We could not complete your authentication. Please try again.";

    const searchParams = new URLSearchParams({
      code: "authentication_failed",
      detail,
      response_type,
      client_id,
      redirect_uri,
    });

    if (state) searchParams.append("state", state.toString());
    if (nonce) searchParams.append("nonce", nonce.toString());

    return NextResponse.redirect(
      new URL(`/error?${searchParams.toString()}`, req.url)
    );
  }

  const responseAuth = await response.json();

  const url = new URL(redirect_uri!.toString());
  if (responseAuth.code) url.searchParams.append("code", responseAuth.code);
  if (responseAuth.token) url.searchParams.append("token", responseAuth.token);
  if (responseAuth.id_token)
    url.searchParams.append("id_token", responseAuth.id_token);

  // FIXME: pass `state` in a secure cookie (signed) from original request to prevent tampering
  if (state) url.searchParams.append("state", state.toString());

  return NextResponse.redirect(url);
};

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const args = await req.json();

  for (const attr of params) {
    if (!args[attr]) return errorRequiredAttribute(attr);
  }

  const {
    response_type,
    client_id,
    redirect_uri,
    nonce,
    merkle_root,
    proof,
    credential_type,
    nullifier_hash,
    state,
    scope,
  } = args;

  const response = await fetch(`${DEVELOPER_PORTAL}/api/v1/oidc/authorize`, {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({
      response_type,
      app_id: client_id,
      redirect_uri,
      nonce,
      merkle_root,
      proof,
      credential_type,
      nullifier_hash,
      scope,
    }),
  });

  if (!response.ok) {
    let errorResponse;
    try {
      errorResponse = await response.json();
    } catch {
      errorResponse = await response.text();
    }

    console.error(
      `Could not authenticate OIDC user: ${response.statusText}`,
      errorResponse
    );

    const detail = Object.hasOwn(errorResponse, "detail")
      ? errorResponse.detail
      : "We could not complete your authentication. Please try again.";

    return NextResponse.json(
      {
        code: "authentication_failed",
        detail,
        response_type,
        client_id,
        redirect_uri,
        state,
        nonce,
      },
      { status: 400 }
    );
  }

  const responseAuth = await response.json();

  const url = new URL(redirect_uri!.toString());
  if (responseAuth.code) url.searchParams.append("code", responseAuth.code);
  if (responseAuth.token) url.searchParams.append("token", responseAuth.token);
  if (responseAuth.id_token)
    url.searchParams.append("id_token", responseAuth.id_token);

  // FIXME: pass `state` in a secure cookie (signed) from original request to prevent tampering
  if (state) url.searchParams.append("state", state.toString());

  return NextResponse.json({ url });
};

export const GET = handlerAuthenticate;
