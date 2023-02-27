import { Button } from "@/components/Button";
import { Footer } from "@/components/Footer";
import {
  IconArrowRight,
  IconBook,
  IconDanger,
  IconReload,
} from "@/components/icons";
import { Spinner } from "@/components/Spinner";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

enum ErrorState {
  Loading = "loading",
  UserError = "userError", // An error from the user; can be tried again
  DevError = "devError", // An error from the developer; requests must be adjusted
}

interface IErrorDetails {
  detail?: string;
  attribute?: string;
}

export default function Error(): JSX.Element {
  const [errorState, setErrorState] = useState<ErrorState>(ErrorState.Loading);
  const [errorDetails, setErrorDetails] = useState<IErrorDetails>({});
  const [requestParams, setRequestParams] = useState<Record<string, string>>(
    {}
  ); // used for retries if applicable
  const router = useRouter();
  useEffect(() => {
    if (router.isReady) {
      const {
        code,
        detail,
        attribute,
        client_id,
        response_type,
        redirect_uri,
        scope,
        state,
        nonce,
      } = router.query as Record<string, string>;
      if (code === "invalid_request") {
        setErrorState(ErrorState.DevError);
      } else {
        setErrorState(ErrorState.UserError);
      }
      setErrorDetails({ detail, attribute });
      setRequestParams({
        client_id,
        response_type,
        redirect_uri,
        scope,
        state,
        nonce,
      });
    }
  }, [router]);
  return (
    <div className="flex justify-center items-center h-full">
      <div>
        <div className="bg-white py-8 px-12 rounded-xl text-center max-w-sm">
          {errorState === ErrorState.Loading && <Spinner />}
          {errorState !== ErrorState.Loading && (
            <>
              <div className="flex justify-center">
                <div className="bg-danger-light rounded-full w-[72px] h-[72px] flex justify-center items-center">
                  <IconDanger className="text-danger mt-1" />
                </div>
              </div>

              <h1 className="font-medium text-xl mt-6">
                {errorState === ErrorState.DevError
                  ? "Application Error"
                  : "Something went wrong"}
              </h1>
              <div className="text-text-muted mt-2">
                {errorState === ErrorState.DevError
                  ? "Something is wrong with this request."
                  : "There was a problem with your sign in request, please try again."}
              </div>
              {errorState === ErrorState.UserError && (
                <div className="mt-6">
                  <Button
                    icon={<IconReload />}
                    onClick={() =>
                      router.push(
                        `/login?${new URLSearchParams(requestParams)}`
                      )
                    }
                  >
                    Try again
                  </Button>
                </div>
              )}
              {errorState === ErrorState.DevError && errorDetails.detail && (
                <div className="text-gray-400 text-sm mt-4">
                  Error: {errorDetails.detail}
                </div>
              )}
              {errorState === ErrorState.DevError && errorDetails.attribute && (
                <div className="text-gray-400 text-sm mt-4">
                  <code>{errorDetails.attribute}</code>
                </div>
              )}
            </>
          )}
        </div>
        {errorState === ErrorState.DevError && (
          <a
            href="https://docs.worldcoin.org/sign-in"
            rel="noreferrer noopener"
            target="_blank"
          >
            <div className="bg-white rounded-lg mt-4 px-4 py-3 text-gray-400 flex items-center">
              <IconBook className="text-xl mr-1" />
              <div className="flex-grow">Developer documentation</div>
              <IconArrowRight className="text-2xl" />
            </div>
          </a>
        )}
        <Footer />
      </div>
    </div>
  );
}
