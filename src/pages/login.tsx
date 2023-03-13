import { Footer } from "@/components/Footer";
import { IconArrowRight, IconWorldcoin } from "@/components/icons";
import { IDKitBridge } from "@/components/IDKitBridge";
import { Spinner } from "@/components/Spinner";
import { IAuthorizeRequest } from "@/types";
import { ISuccessResult } from "@worldcoin/idkit";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Header = ({
  headerShown,
  className,
}: {
  headerShown: boolean;
  className?: string;
}): JSX.Element | null =>
  headerShown ? (
    <div className={className}>
      <div className="flex justify-center">
        <IconWorldcoin className="w-12 h-12" />
      </div>
      <h1 className="font-medium text-3xl mt-8 text-center">
        Sign in with Worldcoin
      </h1>
      <div className="text-text-muted text-xl mt-2 text-center">
        Scan with the app to continue
      </div>
    </div>
  ) : null;

export default function Login() {
  const router = useRouter();
  const [params, setParams] = useState<IAuthorizeRequest>();
  const [isInProgress, setIsInProgress] = useState(true);
  const [deeplink, setDeeplink] = useState("");
  const [isMobile, setIsMobile] = useState(false);

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

    setIsMobile(window.matchMedia("(max-width: 768px)").matches); // to use the same logic as UI (Tailwind)

    if (!ready || !client_id) {
      const urlParams = new URLSearchParams({
        code: "invalid_request",
        detail:
          "Please call the /authorize endpoint with the required parameters.",
        ...router.query,
      });
      router.push(`/error?${urlParams}`);
    }

    setParams({ client_id, nonce, response_type, redirect_uri, scope, state });
  }, [router]);

  const handleIDKitSuccess = async (result: ISuccessResult) => {
    const url = new URL("/api/authenticate", window.location.origin);
    const rawParams: Record<string, string> = {
      ...params,
      ...result,
    };
    Object.keys(rawParams).forEach((key) =>
      rawParams[key] === undefined ? delete rawParams[key] : {}
    );
    url.search = new URLSearchParams(rawParams).toString();
    window.location.href = url.toString();
  };

  return (
    <div className="flex justify-center items-center h-full w-full px-6">
      <div className="flex flex-grow flex-col max-w-xl">
        <Header headerShown={!isInProgress} className="md:hidden" />
        <div className="bg-white rounded-2xl w-full h-full min-w-fit min-h-fit max-h-[39rem] p-8 md:p-16 mt-8 text-center flex flex-col justify-center items-center">
          <Header headerShown={!isInProgress} className="hidden md:block" />
          {!params && <Spinner />}

          {params && (
            <IDKitBridge
              client_id={params.client_id}
              nonce={params.nonce}
              setInProgress={(inProgress) => setIsInProgress(inProgress)}
              setDeeplink={(deeplink) => setDeeplink(deeplink)}
              onSuccess={handleIDKitSuccess}
            />
          )}
        </div>
        {!isInProgress && (
          <>
            <div className="text-center text-gray-400 mt-2">or</div>
            <a
              href={deeplink ? deeplink : "https://worldcoin.org/download"}
              rel="noreferrer noopener"
              target="_blank"
            >
              <div className="bg-white rounded-lg mt-2 px-4 py-3 flex items-center">
                <div className="bg-text rounded p-1 mr-2">
                  <IconWorldcoin className="text-white text-xs" />
                </div>
                <div className="flex-grow">
                  {isMobile ? "Manually open app" : "Sign up in the app"}
                </div>
                <IconArrowRight className="text-2xl text-gray-400" />
              </div>
            </a>
          </>
        )}
        <Footer />
      </div>
    </div>
  );
}
