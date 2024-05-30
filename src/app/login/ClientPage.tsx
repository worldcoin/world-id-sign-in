"use client";

import useSWR from "swr";
import Balancer from "react-wrap-balancer";
import { FC, useCallback, useState } from "react";
import { VerificationState, ISuccessResult } from "@worldcoin/idkit-core";
import IDKitBridge from "@/components/IDKitBridge";
import Image from "next/image";

import {
  IconArrowRight,
  IconBadge,
  IconBadgeX,
  IconWorldcoin,
} from "@/components/icons";
import { DEVELOPER_PORTAL } from "@/consts";

type Meta = {
  name: string;
  is_verified: boolean;
  verified_app_logo: string;
};

// TODO: Move to SSR, use request on /authorize call
const fetchMeta = async (client_id: string) => {
  return fetch(new URL(`/api/v1/precheck/${client_id}`, DEVELOPER_PORTAL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "",
    }),
  }).then((res) => res.json());
};

type Props = {
  scope: string;
  state: string;
  nonce: string;
  client_id: string;
  redirect_uri: string;
  response_type: string;
  response_mode: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

const IDKitQR: FC<Props> = ({
  scope,
  state,
  nonce,
  client_id,
  redirect_uri,
  response_type,
  response_mode,
  code_challenge,
  code_challenge_method,
}) => {
  const { data: app_data } = useSWR<Meta>(client_id, fetchMeta);
  const [deeplink, setDeeplink] = useState("");
  const [wcStage, setWCStage] = useState<VerificationState>(
    VerificationState.PreparingClient
  );

  const handleIDKitSuccess = useCallback(
    async (result: ISuccessResult) => {
      const form = document.getElementById(
        "authentication-form"
      ) as HTMLFormElement;
      const inputs = {
        ...result,
        scope,
        state,
        nonce,
        client_id,
        redirect_uri,
        response_type,
        response_mode,
        code_challenge,
        code_challenge_method,
      };

      Object.entries(inputs).forEach(([key, value]) => {
        if (!value) return;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = `${value}`;
        form.appendChild(input);
      });

      form.submit();
    },
    [
      client_id,
      nonce,
      redirect_uri,
      response_mode,
      response_type,
      scope,
      state,
      code_challenge,
      code_challenge_method,
    ]
  );

  return (
    <>
      <form
        id="authentication-form"
        method="post"
        action="/authenticate"
        style={{ display: "none" }}
      ></form>
      <Header
        meta={app_data}
        className="md:hidden flex flex-col items-center "
        headerShown={
          ![
            VerificationState.WaitingForApp,
            VerificationState.PreparingClient,
            VerificationState.Confirmed,
          ].includes(wcStage)
        }
      />
      <div className="bg-white rounded-2xl w-full h-full mt-6 md:mt-0 md:min-w-[450px] md:min-h-[580px] max-h-[39rem] p-8 md:p-12 text-center flex flex-col justify-center items-center border border-gray-200 relative">
        <div className="absolute top-0 inset-x-0 px-4 py-2 space-x-2 flex items-center border-b">
          <IconWorldcoin className="w-4 h-4" />
          <p className="text-sm font-rubik">Sign in with World ID</p>
        </div>
        <Header
          meta={app_data}
          headerShown={
            ![
              VerificationState.WaitingForApp,
              VerificationState.PreparingClient,
              VerificationState.Confirmed,
            ].includes(wcStage)
          }
          className="hidden md:block"
        />

        <IDKitBridge
          nonce={nonce}
          setStage={setWCStage}
          client_id={client_id}
          setDeeplink={setDeeplink}
          onSuccess={handleIDKitSuccess}
        />
      </div>
      {![
        VerificationState.WaitingForApp,
        VerificationState.PreparingClient,
        VerificationState.Confirmed,
      ].includes(wcStage) && (
        <>
          <div className="text-center text-gray-400 mt-2">or</div>
          <a
            href={deeplink ? deeplink : "https://worldcoin.org/download"}
            rel="noreferrer noopener"
            target="_blank"
          >
            <div className="bg-white rounded-lg mt-2 px-4 py-3 flex items-center border border-gray-200 cursor-pointer">
              <div className="bg-text rounded p-1 mr-2">
                <IconWorldcoin className="text-white text-sm" />
              </div>
              <div className="flex-grow hidden md:block">Manually open app</div>
              <div className="flex-grow md:hidden">Sign up in the app</div>
              <IconArrowRight className="text-2xl text-gray-400" />
            </div>
          </a>
        </>
      )}
    </>
  );
};

const Header = ({
  meta,
  className,
  headerShown,
}: {
  meta?: Meta;
  headerShown: boolean;
  className?: string;
}): JSX.Element | null =>
  headerShown ? (
    <div className={className}>
      <div className="flex items-center justify-center space-x-4">
        <div className="w-14 h-14 border p-1 rounded-full relative mb-4 flex items-center justify-center">
          {meta?.verified_app_logo ? (
            <Image
              unoptimized
              width={60}
              height={60}
              alt={meta?.name}
              src={meta.verified_app_logo}
            />
          ) : (
            <p className="text-xl tracking-wider">
              {meta?.name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </p>
          )}
          <div className="absolute -bottom-1 -right-1">
            {meta?.verified_app_logo ? (
              <IconBadge className="w-6 h-6" />
            ) : (
              <IconBadgeX className="w-6 h-6" />
            )}
          </div>
        </div>
      </div>
      <div className="text-xl md:text-2xl mt-2 text-center font-semibold font-sora max-w-[350px]">
        <Balancer>Scan with World App to continue to {meta?.name}</Balancer>
      </div>
    </div>
  ) : null;

export default IDKitQR;
