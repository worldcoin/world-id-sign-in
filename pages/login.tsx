import { IAuthorizeRequest } from "@/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
// FIXME
// @ts-ignore package is temporarily broken
import { IDKitWidget, ISuccessResult } from "@worldcoin/idkit";

export default function Login() {
  const router = useRouter();
  const [params, setParams] = useState<IAuthorizeRequest>();

  useEffect(() => {
    const {
      client_id,
      nonce,
      response_type,
      ready,
      redirect_uri,
      scope,
      state,
    } = router.query as Record<string, string>;

    if (!router.isReady) {
      return;
    }

    if (!ready || !client_id) {
      router.push("/error?code=invalid_request");
    }

    setParams({ client_id, nonce, response_type, redirect_uri, scope, state });
  }, [router]);

  const handleIDKitSuccess = async (result: ISuccessResult) => {
    const url = new URL("/api/authenticate", window.location.origin);
    url.search = new URLSearchParams({ ...params, ...result }).toString();
    window.location.href = url.toString();
  };

  if (!params) {
    // TODO: Nice loading state
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center">
      <h1 className="text-3xl font-bold">Sign In with World ID</h1>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <IDKitWidget
          app_id={params.client_id}
          action=""
          signal={params.nonce}
          walletConnectProjectId="75694dcb8079a0baafc84a459b3d6524"
          enableTelemetry
          // TODO: Do a preverification with dev portal to provide a better UX
          handleVerify={undefined}
          onSuccess={handleIDKitSuccess}
        >
          {/* // FIXME
              // @ts-ignore package is temporarily broken */}
          {({ open }) => <button onClick={open}>Verify me</button>}
        </IDKitWidget>
      </div>
    </div>
  );
}
