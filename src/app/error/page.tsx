import Footer from "@/components/Footer";
import { ButtonLink } from "@/components/Button";
import {
  IconArrowRight,
  IconBook,
  IconDanger,
  IconReload,
} from "@/components/icons";

enum ErrorState {
  Loading = "loading",
  UserError = "userError", // An error from the user; can be tried again
  DevError = "devError", // An error from the developer; requests must be adjusted
}

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const ErrorPage = ({
  searchParams: {
    code,
    detail,
    attribute,
    client_id,
    response_type,
    redirect_uri,
    scope,
    state,
    nonce,
    ready,
  },
}: Props) => {
  let errorState: ErrorState;
  if (
    code === "invalid_request" ||
    code === "invalid_redirect_uri" ||
    attribute === "client_id"
  ) {
    errorState = ErrorState.DevError;
  } else {
    errorState = ErrorState.UserError;
  }

  const retryLink = `${process.env.NEXT_PUBLIC_URL}/login?${new URLSearchParams(
    {
      client_id,
      response_type,
      redirect_uri,
      scope,
      state,
      nonce,
      ready,
    } as Record<string, string>
  )}`;

  return (
    <div className="flex justify-center items-center w-full h-full px-6">
      <div className="flex flex-grow flex-col max-w-xl">
        <div className="bg-white p-16 rounded-2xl text-center min-h-fit max-h-[39rem] flex flex-col justify-center items-center">
          <div className="flex justify-center">
            <div className="bg-danger-light rounded-full flex justify-center items-center">
              <IconDanger className="text-danger w-12 h-12" />
            </div>
          </div>

          <h1 className="font-medium text-3xl mt-8">
            {errorState === ErrorState.DevError
              ? "Application Error"
              : "Something went wrong"}
          </h1>
          <div className="text-text-muted text-xl mt-4">
            {errorState === ErrorState.DevError
              ? "Something is wrong with this request."
              : "There was a problem with your sign in request, please try again."}
          </div>
          {errorState === ErrorState.UserError && (
            <div className="mt-6">
              <ButtonLink href={retryLink} icon={<IconReload />}>
                Try again
              </ButtonLink>
            </div>
          )}
          {errorState === ErrorState.DevError && detail && (
            <div className="text-gray-400 text-sm mt-4">Error: {detail}</div>
          )}
          {errorState === ErrorState.DevError && attribute && (
            <div className="text-gray-400 text-sm mt-4">
              <code>{attribute}</code>
            </div>
          )}
        </div>
        {errorState === ErrorState.DevError && (
          <a
            href="https://docs.worldcoin.org/id/sign-in"
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
};

export default ErrorPage;
