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

export const MiniAppRouter = ({
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
}: MiniAppRouterProps) => {
  const router = useRouter();
  // If window.WorldApp is defined redirect to /authorize again with the params
  if (window.WorldApp) {
    router.replace(
      `/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`
    );
  }
  return <></>;
};
