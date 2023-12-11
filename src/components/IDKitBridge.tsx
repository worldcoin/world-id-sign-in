import { Spinner } from "./Spinner";
import { memo, useCallback, useEffect, useState } from "react";
import { VerificationState } from "@worldcoin/idkit/build/src/types/app";
import {
  ISuccessResult,
  CredentialType,
  internal as IDKitInternal,
} from "@worldcoin/idkit";
import copy from "copy-to-clipboard";
import { AnimatePresence, LazyMotion, m } from "framer-motion";

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
  const { reset, qrData, result, errorCode, verificationState } =
    IDKitInternal.useAppConnection(
      client_id,
      "",
      nonce,
      [CredentialType.Orb, CredentialType.Phone],
      "Sign in with World ID",
      "4e15bfc7b9842886c4e49d8f8ef04cf1"
    );

  useEffect(() => {
    setStage(verificationState);

    if (verificationState === IDKitInternal.VerificationState.Failed) {
      console.error("Sign in with World ID failed.", errorCode);
      reset();
    }

    if (
      verificationState === IDKitInternal.VerificationState.Confirmed &&
      result
    ) {
      onSuccess(result);
    }
  }, [verificationState, reset, setStage, onSuccess, result, errorCode]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches; // to use the same logic as UI (Tailwind)
    if (isMobile && qrData?.mobile) {
      setTimeout(
        () => window.open(qrData.mobile, "_blank", "noopener,noreferrer"),
        1000 // Wait for WalletConnect session to be established
      );
    }

    if (qrData?.mobile) setDeeplink(qrData.mobile);
  }, [qrData, setDeeplink]);

  const isStaging = /^app_staging_/.test(client_id); // naively check if staging app to enable click-to-copy QR code

  const [copiedLink, setCopiedLink] = useState(false);
  const copyLink = useCallback(() => {
    if (isStaging && qrData?.default) {
      // only copy if staging app and qrData is available
      copy(qrData?.default);

      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }, [qrData, isStaging]);

  return (
    <div className="md:mt-8">
      {verificationState ===
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          {!qrData?.default && !qrData?.mobile && <Spinner />}
          {qrData?.default && (
            <>
              {isStaging ? (
                <>
                  {/* .qr-code className used for remote synthetic tests */}
                  <div
                    className="hidden md:block qr-code cursor-pointer"
                    onClick={copyLink}
                  >
                    <IDKitInternal.QRCode data={qrData?.default} size={280} />
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
                  </LazyMotion>{" "}
                </>
              ) : (
                <>
                  {/* .qr-code className used for remote synthetic tests */}
                  <div className="hidden md:block qr-code">
                    <IDKitInternal.QRCode data={qrData?.default} size={280} />
                  </div>{" "}
                </>
              )}
              <div className="md:hidden mt-10 md:mt-0">
                <Spinner />
                <div className="text-text-muted pt-4">
                  Wait a few seconds, automatically opening World App
                </div>
              </div>
            </>
          )}
        </>
      )}
      {verificationState !==
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          <Spinner />
          {verificationState ===
            IDKitInternal.VerificationState.LoadingWidget && (
            <>
              <h1 className="font-medium text-3xl mt-12">Loading...</h1>
              <div className="text-text-muted text-xl mt-2">
                Please wait a moment
              </div>
            </>
          )}
          {verificationState ===
            IDKitInternal.VerificationState.AwaitingVerification && (
            <>
              <h1 className="font-medium text-3xl mt-12">
                Confirm in World App
              </h1>
              <div className="text-text-muted text-xl mt-2">
                Waiting for your response
              </div>
            </>
          )}
          {verificationState === IDKitInternal.VerificationState.Confirmed && (
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
