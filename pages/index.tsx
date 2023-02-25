import { IDKitWidget, ISuccessResult, useIDKit } from "@worldcoin/idkit";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [params, setParams] = useState({
    app_id: "",
    redirect_uri: "",
    response_type: "",
    state: "",
    nonce: "",
  });

  // Special handling for signals, must be set to either nonce OR the timestamp value passed to IDKit
  const signal = useMemo<string>(() => {
    if (params.nonce) return params.nonce;
    return Date.now().toString();
  }, [params.nonce]);

  // const handleAuthCodeFlow = () => {}
  // const handleImplicitFlow = () => {}

  const handleProof = async (result: ISuccessResult) => {
    console.log("handleProof():", result); // DEBUG

    // Handle the authorization code flow
    if (params.response_type === "code") {
      const body = JSON.stringify({
        app_id: params.app_id,
        response_type: params.response_type,
        redirect_uri: params.redirect_uri,
        state: params.state,
        nonce: signal, // Force a nonce, since we are re-using it as signal
        ...result,
      });

      const response = await fetch("/api/auth", {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body,
      });

      console.log(response); // DEBUG
      console.log(await response.json());

      // if (response) router.push(await response.text());
    }

    // Handle the implicit code flow
    else if (
      params.response_type === "id_token" ||
      params.response_type === "id_token token" ||
      params.response_type === "implicit" // TODO: Remove after PR
    ) {
      // Enforce that a nonce is set by the calling application
      // if (!params.nonce) {
      //   redirect(
      //     `${
      //       params.redirect_uri
      //     }?error=invalid_request&error_description=${encodeURIComponent(
      //       "The nonce parameter is required for implicit flow"
      //     )}&state=${params.state}`,
      //     { statusCode: 302 }
      //   );
      // }

      const body = JSON.stringify({
        app_id: params.app_id,
        response_type: params.response_type,
        redirect_uri: params.redirect_uri,
        nonce: signal,
        ...result,
      });

      // Authorize the returned proof
      const response = await fetch(
        "https://dev2.worldcoin.org/api/v1/oidc/authorize",
        {
          method: "POST",
          headers: new Headers({ "content-type": "application/json" }),
          body,
        }
      );
      console.log(response); // DEBUG

      // Authorization was successful, proceed with the rest of the flow
      if (response.ok) {
        const token = await response.json();
        console.log(token); // DEBUG

        // router.push(
        //   `${params.redirect_uri}?id_token=${token.jwt}&state=${params.state}`
        // );
      }

      // Authorization failed, show an error message to the user
      // router.push(
      //   `${
      //     params.redirect_uri
      //   }?error=auth_failed&error_description=${encodeURIComponent(
      //     "Authentication failed, please try again later"
      //   )}&state=${params.state}`
      // );
    }

    // Flows outside of authorization code and implicit are not currently supported
    else {
      router.push(
        `${
          params.redirect_uri
        }?error=invalid_request&error_description=${encodeURIComponent(
          "World ID only supports authorization code and implicit flows"
        )}&state=${params.state}`
      );
    }
  };

  const onSuccess = (result) => {
    console.log("onSuccess():", result); // DEBUG
  };

  const { open, setOpen } = useIDKit({
    onSuccess: onSuccess,
    handleVerify: handleProof,
  });

  /**
   * On page load, set the callback and start IDKit flow
   */
  useEffect(() => {
    console.log("useEffect()"); // DEBUG

    if (router.isReady) {
      console.log("router.isReady"); // DEBUG
      const { client_id, redirect_uri, response_type, state, nonce } =
        router.query;

      setParams({
        app_id: client_id,
        redirect_uri,
        response_type,
        state,
        nonce,
      });
    }

    // Automatically open IDKit
    if (!open) {
      console.log("opening");
      setOpen(true);
    }
  }, [router, open, setOpen]);

  return (
    <div>
      <h1>Sign In with World ID</h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        {console.log(signal)}
        {params.app_id && (
          <IDKitWidget
            app_id={params.app_id}
            action=""
            signal={signal}
            walletConnectProjectId="75694dcb8079a0baafc84a459b3d6524"
          >
            {({ open }) => <button onClick={open}>Click me</button>}
          </IDKitWidget>
        )}
      </div>
    </div>
  );
}
