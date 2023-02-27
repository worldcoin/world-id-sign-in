import { IAuthorizeRequest } from "@/types";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ISuccessResult } from "@worldcoin/idkit";
import { IconArrowRight, IconWorldcoin } from "@/components/icons";
import { Footer } from "@/components/Footer";
import { Spinner } from "@/components/Spinner";
import { IDKitBridge } from "@/components/IDKitBridge";

export default function Login() {
  const router = useRouter();
  const [params, setParams] = useState<IAuthorizeRequest>();
  const [headerShown, setHeaderShown] = useState(true);

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
      const urlParams = new URLSearchParams({
        code: "invalid_request",
        detail:
          "Please call the /authorize endpoint with the required parameters.",
      });
      router.push(`/error?${urlParams}`);
    }

    setParams({ client_id, nonce, response_type, redirect_uri, scope, state });
  }, [router]);

  const handleIDKitSuccess = async (result: ISuccessResult) => {
    const url = new URL("/api/authenticate", window.location.origin);
    url.search = new URLSearchParams({ ...params, ...result }).toString();
    window.location.href = url.toString();
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div>
        <div className="bg-white py-8 px-12 rounded-xl text-center max-w-sm">
          {headerShown && (
            <>
              <div className="flex justify-center">
                <IconWorldcoin className="text-2xl" />
              </div>
              <h1 className="font-medium text-xl mt-6">
                Sign in with Worldcoin
              </h1>
              <div className="text-text-muted mt-2">
                Scan with the app to continue
              </div>
            </>
          )}

          {!params && <Spinner />}

          {params && (
            <IDKitBridge
              client_id={params.client_id}
              nonce={params.nonce}
              toggleHeader={(visible) => setHeaderShown(visible)}
            />
          )}
        </div>
        <div className="text-center text-gray-400 mt-2">or</div>
        <a
          href="https://worldcoin.org/download"
          rel="noreferrer noopener"
          target="_blank"
        >
          <div className="bg-white rounded-lg mt-2 px-4 py-3 flex items-center">
            <div className="bg-text rounded p-1 mr-2">
              <IconWorldcoin className="text-white text-xs" />
            </div>
            <div className="flex-grow">Sign up in the app</div>
            <IconArrowRight className="text-2xl text-gray-400" />
          </div>
        </a>
        <Footer />
      </div>
    </div>
  );
}
