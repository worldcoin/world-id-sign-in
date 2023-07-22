import { Spinner } from "./Spinner";
import { memo, useEffect } from "react";
import { VerificationState } from "@worldcoin/idkit/build/src/types/app";
import {
  ISuccessResult,
  CredentialType,
  internal as IDKitInternal,
} from "@worldcoin/idkit";

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
      "Sign in with Worldcoin",
      "4e15bfc7b9842886c4e49d8f8ef04cf1"
    );

  useEffect(() => {
    setStage(verificationState);

    if (verificationState === IDKitInternal.VerificationState.Failed) {
      console.error("Sign in with Worldcoin failed.", errorCode);
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

  return (
    <div className="md:mt-12">
      {verificationState ===
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          {!qrData?.default && !qrData?.mobile && <Spinner />}
          {qrData?.default && (
            <>
              {/* .qr-code className used for remote synthetic tests */}
              <div className="hidden md:block qr-code">
                <IDKitInternal.QRCode data={qrData?.default} size={280} />
              </div>
              <div className="md:hidden">
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
