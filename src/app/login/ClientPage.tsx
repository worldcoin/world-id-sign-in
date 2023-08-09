"use client";

import useSWR from "swr";
import { FC, useCallback, useState } from "react";
import { ISuccessResult, internal } from "@worldcoin/idkit";
import IDKitBridge from "@/components/IDKitBridge";
import { internal as IDKitInternal } from "@worldcoin/idkit";
import { IconArrowRight, IconWorldcoin } from "@/components/icons";
import { VerificationState } from "@worldcoin/idkit/build/src/types/app";
import Image from "next/image";

type Meta = {
  name: string;
  is_verified: boolean;
  verified_app_logo: string;
};

const fetchMeta = async (client_id: string) => {
  return fetch(`https://developer.worldcoin.org/api/v1/precheck/${client_id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "",
      external_nullifier: internal.generateExternalNullifier(client_id, "")
        .digest,
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
};

const IDKitQR: FC<Props> = ({
  scope,
  state,
  nonce,
  client_id,
  redirect_uri,
  response_type,
}) => {
  const { data: app_data } = useSWR<Meta>(client_id, fetchMeta);
  const [deeplink, setDeeplink] = useState("");
  const [wcStage, setWCStage] = useState<VerificationState>(
    IDKitInternal.VerificationState.LoadingWidget
  );

  const handleIDKitSuccess = useCallback(
    async (result: ISuccessResult) => {
      const url = new URL("/authenticate", window.location.origin);

      const rawParams: Record<string, string> = {
        ...result,
        scope,
        state,
        nonce,
        client_id,
        redirect_uri,
        response_type,
      };

      Object.keys(rawParams).forEach((key) =>
        rawParams[key] === undefined ? delete rawParams[key] : {}
      );

      url.search = new URLSearchParams(rawParams).toString();
      window.location.href = url.toString();
    },
    [client_id, nonce, redirect_uri, response_type, scope, state]
  );

  console.log(app_data);

  return (
    <>
      <Header
        meta={app_data}
        headerShown={
          ![
            IDKitInternal.VerificationState.AwaitingVerification,
            IDKitInternal.VerificationState.LoadingWidget,
            IDKitInternal.VerificationState.Confirmed,
          ].includes(wcStage)
        }
        className="md:hidden"
      />
      <div className="bg-white rounded-2xl w-full h-full mt-6 md:mt-0 md:min-w-[450px] md:min-h-[580px] max-h-[39rem] p-8 md:p-12 text-center flex flex-col justify-center items-center border border-gray-200">
        <Header
          meta={app_data}
          headerShown={
            ![
              IDKitInternal.VerificationState.AwaitingVerification,
              IDKitInternal.VerificationState.LoadingWidget,
              IDKitInternal.VerificationState.Confirmed,
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
        IDKitInternal.VerificationState.AwaitingVerification,
        IDKitInternal.VerificationState.LoadingWidget,
        IDKitInternal.VerificationState.Confirmed,
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
        <IconWorldcoin className="w-12 h-12" />
        {meta?.verified_app_logo && (
          <>
            <span className="text-lg">&times;</span>
            <Image
              className="border-2 p-1 rounded-full border-black"
              unoptimized
              width={50}
              height={50}
              alt={meta?.name}
              src={meta.verified_app_logo}
            />
          </>
        )}
      </div>
      <h1 className="text-2xl md:text-3xl mt-8 text-center font-sora font-semibold">
        Sign in with Worldcoin
      </h1>
      <div className="text-text-muted text-lg md:text-xl mt-2 text-center font-rubik max-w-[350px]">
        Scan with the app to continue
        {meta?.name ? ` to ${meta.name}` : ""}
      </div>
    </div>
  ) : null;

export default IDKitQR;
