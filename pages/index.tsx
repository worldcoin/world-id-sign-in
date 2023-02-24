import { IDKitWidget, ISuccessResult } from "@worldcoin/idkit";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [appId, setAppId] = useState();
  const [nonce, setNonce] = useState();
  const [redirectUri, setRedirectUri] = useState();
  const [responseType, setResponseType] = useState();
  const [state, setState] = useState();

  const authCode = async () => {
    const response = await fetch("/api/auth");
    console.log(await response.json());
  };

  const handleProof = async (result: ISuccessResult) => {
    console.log("handleProof():", result); // DEBUG

    // Handle the authorization code flow
    if (responseType === "code") {
      const body = JSON.stringify({
        app_id: appId,
        response_type: responseType,
        ...result,
      });

      fetch("/api/auth", {
        method: "POST",
        body,
      });
    }

    // Handle the implicit code flow
    else if (responseType === "id_token") {
      const body = JSON.stringify({
        app_id: appId,
        response_type: responseType,
        nonce,
        ...result,
      });

      // Authorize the returned proof
      const response = await fetch(
        `https://dev2.worldcoin.org/api/v1/oidc/authorize`,
        {
          method: "POST",
          body,
        }
      );
      console.log(response); // DEBUG

      // Authorization was successful, proceed with the rest of the flow
      if (response.status === 200) {
        // resolve();
      }

      // Authorization failed, show an error message to the user
      console.error("Something went wrong");
      // reject();
    }
  };

  const onSuccess = (result) => {
    console.log("onSuccess():", result); // DEBUG

    // Implicit flow, return the id_token to the passed redirect_uri
    router.push(`${redirectUri}?id_token=${result.jwt}&state=${state}`);
  };

  // TODO: Reenable after Miguel fixes hook
  // const { open, setOpen } = useIDKit({
  //   action: "my_action",
  //   signal: "my_signal",
  //   onSuccess: onSuccess,
  //   handleVerify: handleProof,
  //   app_id: "app_40fb1f035db244646bf141109ac51042",
  //   walletConnectProjectId: "75694dcb8079a0baafc84a459b3d6524",
  // });

  /**
   * On page load, set the callback and start IDKit flow
   */
  useEffect(() => {
    console.log("useEffect()"); // DEBUG

    if (router.isReady) {
      const { client_id, redirect_uri, response_type, state, nonce } =
        router.query;
      if (client_id) setAppId(client_id);
      if (redirect_uri) setRedirectUri(redirect_uri);
      if (response_type) setResponseType(response_type);
      if (state) setState(state);
      if (nonce) setNonce(nonce);
    }

    // TODO: Reenable after Miguel fixes hook
    // if (!open) {
    //   console.log("opening");
    //   setOpen(true);
    // }
  }, [router]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <h1>Sign In with World ID</h1>
        {appId && (
          <IDKitWidget
            app_id={appId}
            action=""
            signal={nonce ? nonce : ""}
            walletConnectProjectId="75694dcb8079a0baafc84a459b3d6524"
            handleVerify={handleProof}
            onSuccess={onSuccess}
          >
            {({ open }) => <button onClick={open}>Click me</button>}
          </IDKitWidget>
        )}
        {/* <IDKitWidget /> */}
      </div>
    </div>
  );
}
