import { internal as IDKitInternal, ISuccessResult } from "@worldcoin/idkit";
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
    console.log("result", result);
  }, [result]);

  useEffect(() => {
    console.log("errorCode", errorCode);
  }, [errorCode]);

  useEffect(() => {
    console.log("verificationState", verificationState);

    if (
      verificationState === IDKitInternal.VerificationState.AwaitingConnection
    ) {
      toggleHeader(true);
    } else {
      toggleHeader(false);
    }

    if (verificationState === IDKitInternal.VerificationState.Failed) {
      reset();
    }

    if (
      verificationState === IDKitInternal.VerificationState.Confirmed &&
      result
    ) {
      onSuccess(result);
    }
  }, [verificationState, reset, toggleHeader, onSuccess, result]);

  return (
    <div className="mt-12">
      {verificationState ===
        IDKitInternal.VerificationState.AwaitingConnection && (
        <>
          {!qrData?.default && <Spinner />}
          {qrData?.default && (
            <IDKitInternal.QRCode
              data={qrData?.default}
              logoSize={0}
              size={280}
            />
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

{
  /* <IDKitWidget
app_id={params.client_id}
action=""
signal={params.nonce}
walletConnectProjectId="75694dcb8079a0baafc84a459b3d6524"
enableTelemetry
// TODO: Do a preverification with dev portal to provide a better UX
handleVerify={undefined}
onSuccess={handleIDKitSuccess}
autoClose
>
{/* FIXME: The actual thing should be shown thing */
}
// {({ open }) => (
//   <Button onClick={open} className="mt-6">
//     Verify me
//   </Button>
// )}
// </IDKitWidget>
// */}
