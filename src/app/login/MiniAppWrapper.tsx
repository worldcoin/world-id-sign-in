"use client";

import { useRouter } from "next/navigation";

type MiniAppRouterProps = {
  client_id?: string;
  nonce?: string;
  response_type?: string;
  ready?: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  response_mode?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

export const MiniAppRouter = (props: MiniAppRouterProps) => {
  const {
    client_id,
    nonce,
    response_type,
    ready,
    redirect_uri,
    scope,
    state,
    response_mode,
    code_challenge,
    code_challenge_method,
  } = props;
  const router = useRouter();

  // If window.WorldApp is defined redirect to /authorize again with the params
  function buildAuthorizeUrl(params: any): string {
    const queryParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
      .join("&");

    return `/authorize?${queryParams}`;
  }

  if (typeof window !== "undefined" && window.WorldApp) {
    router.replace(
      buildAuthorizeUrl({
        response_type,
        client_id,
        redirect_uri,
        scope,
        state,
        nonce,
        response_mode,
        code_challenge,
        code_challenge_method,
      })
    );
  }
  return <></>;
};
