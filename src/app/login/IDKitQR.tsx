"use client";

import Balancer from "react-wrap-balancer";
import { FC, useCallback, useMemo, useState } from "react";
import { VerificationState, ISuccessResult } from "@worldcoin/idkit-core";
import IDKitBridge from "@/components/IDKitBridge";
import Image from "next/image";

import { IconBadge, IconBadgeX, IconWorldcoin } from "@/components/icons";
import clsx from "clsx";
import { isMobileDevice } from "@/lib/utils";

type Meta = {
  name: string;
  is_verified: boolean;
  verified_app_logo: string;
};

type Props = {
  scope: string;
  state: string;
  nonce: string;
  client_id: string;
  app_data: Meta;
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
  app_data,
  redirect_uri,
  response_type,
  response_mode,
  code_challenge,
  code_challenge_method,
}) => {
  const [deeplink, setDeeplink] = useState("");
  const [wcStage, setWCStage] = useState<VerificationState>(
    VerificationState.PreparingClient
  );
  const isMobile = useMemo(() => isMobileDevice(), []);

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
      <div
        className={clsx(
          "bg-white max-sm:hidden rounded-2xl w-full h-full mt-6 md:mt-0 md:min-w-[450px] md:min-h-[580px] max-h-[39rem] p-8 md:p-12 text-center flex flex-col justify-center items-center border border-gray-200 relative"
        )}
      >
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
          <a href={deeplink} className={clsx("mt-3 sm:hidden")}>
            <div className="bg-black rounded-lg mt-2 px-8 py-4 gap-x-4 flex items-center border border-gray-200 cursor-pointer">
              <IconWorldcoin className="text-white text-sm" />
              <p className="text-white">Continue in World App</p>
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
                ?.split(" ")
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
      <div className="hidden md:block text-xl md:text-2xl mt-2 text-center font-semibold font-sora max-w-[350px] break-words">
        <Balancer>Scan with World App to sign in to {meta?.name}</Balancer>
      </div>
      <div className="md:hidden block text-xl md:text-2xl mt-2 text-center font-semibold font-sora max-w-[350px]">
        <Balancer>Use World App to sign in to {meta?.name}</Balancer>
      </div>
    </div>
  ) : null;

export default IDKitQR;
