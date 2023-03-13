import {
  CredentialType,
  internal as IDKitInternal,
  ISuccessResult,
} from "@worldcoin/idkit";
import { useEffect } from "react";
import { Spinner } from "./Spinner";

interface IIDKitBridge {
  client_id: string;
  nonce: string;
  setInProgress: (visible: boolean) => void;
  onSuccess: (result: ISuccessResult) => void;
  setDeeplink: (deeplink: string) => void;
}

export const IDKitBridge = ({
  client_id,
  nonce,
  setInProgress,
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
    if (
      verificationState === IDKitInternal.VerificationState.AwaitingConnection
    ) {
      setInProgress(false);
    } else {
      setInProgress(true);
    }

    if (verificationState === IDKitInternal.VerificationState.Failed) {
      console.warn("Sign in with World ID failed.", errorCode);
      reset();
    }

    if (
      verificationState === IDKitInternal.VerificationState.Confirmed &&
      result
    ) {
      onSuccess(result);
    }
  }, [verificationState, reset, setInProgress, onSuccess, result, errorCode]);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches; // to use the same logic as UI (Tailwind)
    console.log(isMobile);
    if (isMobile && qrData?.mobile) {
      setTimeout(
        () => window.open(qrData.mobile, "_blank", "noopener,noreferrer"),
        1000 // Wait for WalletConnect session to be established
      );
      setDeeplink(qrData.mobile);
    }
  }, [qrData, setDeeplink]);

  return (
    <div className="md:mt-12">
      {verificationState ===
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          {!qrData?.default && !qrData?.mobile && <Spinner />}
          {qrData?.default && (
            <>
              <div className="hidden md:block">
                <IDKitInternal.QRCode
                  data={qrData?.default}
                  logoSize={0}
                  size={280}
                />
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
