import { ISuccessResult, internal as IDKitInternal } from "@worldcoin/idkit";
import { isMobile } from "react-device-detect";
import { useEffect } from "react";
import { Spinner } from "./Spinner";

interface IIDKitBridge {
  client_id: string;
  nonce: string;
  toggleHeader: (visible: boolean) => void;
  onSuccess: (result: ISuccessResult) => void;
}

export const IDKitBridge = ({
  client_id,
  nonce,
  toggleHeader,
  onSuccess,
}: IIDKitBridge): JSX.Element => {
  const { reset, qrData, result, errorCode, verificationState } =
    IDKitInternal.useAppConnection(
      client_id,
      "",
      nonce,
      "Sign in with World ID",
      "4e15bfc7b9842886c4e49d8f8ef04cf1"
    );

  useEffect(() => {
    if (
      verificationState === IDKitInternal.VerificationState.AwaitingConnection
    ) {
      toggleHeader(true);
    } else {
      toggleHeader(false);
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
  }, [verificationState, reset, toggleHeader, onSuccess, result, errorCode]);

  useEffect(() => {
    if (isMobile && qrData?.mobile) {
      window.open(qrData.mobile, "_blank", "noopener,noreferrer");
    }
  }, [qrData]);

  return (
    <div className="mt-8">
      {verificationState ===
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          {!qrData?.default && !qrData?.mobile && <Spinner />}
          {qrData?.default && !isMobile && (
            <IDKitInternal.QRCode
              data={qrData?.default}
              logoSize={0}
              size={250}
            />
          )}
        </>
      )}
      {verificationState !==
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          <Spinner />
          {verificationState ===
            IDKitInternal.VerificationState.AwaitingVerification && (
            <>
              <h1 className="font-medium text-xl mt-6">Confirm in World App</h1>
              <div className="text-text-muted mt-2">
                Waiting for your response
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
