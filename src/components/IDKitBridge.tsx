import { Spinner } from "./Spinner";
import { memo, useCallback, useEffect, useState } from "react";
import copy from "copy-to-clipboard";
import { AnimatePresence, LazyMotion, m } from "framer-motion";
import { QRCode } from "@worldcoin/idkit/internal";

import {
  VerificationState,
  ISuccessResult,
  useWorldBridgeStore,
  IDKitConfig,
  VerificationLevel,
} from "@worldcoin/idkit-core";
import clsx from "clsx";
import { isMobileDevice } from "@/lib/utils";

interface IIDKitBridge {
  nonce: string;
  client_id: string;
  setDeeplink: (deeplink: string) => void;
  onSuccess: (result: ISuccessResult) => void;
  setStage: (stage: VerificationState) => void;
}

const IDKitBridge = ({
  client_id,
  nonce,
  setStage,
  onSuccess,
  setDeeplink,
}: IIDKitBridge): JSX.Element => {
  const [intervalId, setIntervalId] = useState<NodeJS.Timer | null>(null);

  const {
    createClient,
    connectorURI,
    bridge_url,
    result,
    errorCode,
    verificationState,
    reset,
    pollForUpdates,
  } = useWorldBridgeStore();

  useEffect(() => {
    if (verificationState !== VerificationState.PreparingClient) {
      return;
    }

    createClient({
      app_id: client_id as IDKitConfig["app_id"],
      action: "",
      signal: nonce,
      bridge_url,
      verification_level: VerificationLevel.Device,
      action_description: "Sign in with Worldcoin",
    })
      .then(() => {
        const intervalId = setInterval(() => {
          pollForUpdates().catch((error) => {
            console.error(error);
            setIntervalId(null);
            clearInterval(intervalId);
          });
        }, 3000);

        setIntervalId(intervalId);
      })
      .catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
      });
  }, [
    bridge_url,
    client_id,
    createClient,
    nonce,
    pollForUpdates,
    verificationState,
  ]);

  const stopInterval = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }, [intervalId]);

  useEffect(() => {
    if (
      [VerificationState.Failed, VerificationState.Confirmed].includes(
        verificationState
      ) &&
      intervalId
    ) {
      clearInterval(intervalId);
    }
  }, [verificationState, intervalId]);

  useEffect(() => {
    setStage(verificationState);

    if (verificationState === VerificationState.Failed) {
      console.error("Sign in with World ID failed.", errorCode);
      reset();
      stopInterval();
    }

    if (verificationState === VerificationState.Confirmed && result) {
      onSuccess(result);
      stopInterval();
    }
  }, [
    verificationState,
    reset,
    setStage,
    onSuccess,
    result,
    errorCode,
    stopInterval,
  ]);

  useEffect(() => {
    if (connectorURI) {
      setDeeplink(connectorURI);
    }
  }, [connectorURI, setDeeplink]);

  const isStaging = /^app_staging_/.test(client_id); // naively check if staging app to enable click-to-copy QR code
  const [copiedLink, setCopiedLink] = useState(false);

  const copyLink = useCallback(() => {
    if (isStaging && connectorURI) {
      // only copy if staging app and qrData is available
      copy(connectorURI);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [connectorURI, isStaging]);

  return (
    <div className="md:mt-8 mt-7">
      {verificationState === VerificationState.WaitingForConnection && (
        <>
          {!connectorURI && <Spinner />}

          {connectorURI && (
            <>
              {isStaging ? (
                <>
                  {/* .qr-code className used for remote synthetic tests */}
                  <div
                    className={clsx("qr-code cursor-pointer max-md:mt-8", {
                      hidden: isMobileDevice(),
                    })}
                    onClick={copyLink}
                  >
                    <QRCode data={connectorURI} size={280} />
                  </div>
                  <LazyMotion
                    // only load framer if displaying QR code for mobile performance
                    features={async () =>
                      (await import("./animations")).default
                    }
                  >
                    <AnimatePresence>
                      {copiedLink && (
                        <m.div
                          className="text-sm"
                          key="copied"
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={{
                            hidden: {
                              opacity: 0,
                              height: 0,
                              marginTop: 0,
                              y: 0,
                            },
                            visible: {
                              opacity: 1,
                              height: "auto",
                              marginTop: 16,
                              y: 12,
                              transition: {
                                duration: 0.25,
                                opacity: { delay: 0.1 },
                                ease: "easeInOut",
                              },
                            },
                            exit: {
                              opacity: 0,
                              height: 0,
                              marginTop: 0,
                              y: 0,
                              transition: {
                                duration: 0.4,
                                delay: 0.1,
                                opacity: { duration: 0.25, delay: 0 },
                                ease: "easeInOut",
                              },
                            },
                          }}
                        >
                          <span className="border-f1f5f8 rounded-lg border py-1 px-2 text-sm">
                            {"QR Code copied"}
                          </span>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </LazyMotion>
                </>
              ) : (
                <>
                  {/* .qr-code className used for remote synthetic tests */}
                  <div
                    className={clsx("qr-code max-md:mt-8", {
                      hidden: isMobileDevice(),
                    })}
                  >
                    <QRCode data={connectorURI} size={280} />
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {verificationState !== VerificationState.WaitingForConnection && (
        <>
          <Spinner />

          {verificationState === VerificationState.PreparingClient && (
            <>
              <h1 className="font-medium text-3xl md:mt-12 mt-4">Loading...</h1>
              <div className="text-text-muted text-xl mt-2">
                Please wait a moment
              </div>
            </>
          )}

          {verificationState === VerificationState.WaitingForApp && (
            <>
              <h1 className="font-medium text-3xl mt-12">
                Confirm in World App
              </h1>
              <div className="text-text-muted text-xl mt-2">
                Waiting for your response
              </div>
            </>
          )}

          {verificationState === VerificationState.Confirmed && (
            <>
              <h1 className="font-medium text-3xl mt-12">Identity Confirmed</h1>
              <div className="text-text-muted text-xl mt-2">
                Taking you back to your app
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default memo(IDKitBridge);
