import IDKitQR from "./ClientPage";
import Footer from "@/components/Footer";
import { redirect } from "next/navigation";

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const LoginPage = ({ searchParams }: Props) => {
  const {
    client_id,
    nonce,
    response_type,
    ready,
    redirect_uri,
    scope,
    state,
    response_mode,
  } = searchParams;

  if (!ready || !client_id) {
    const urlParams = new URLSearchParams({
      code: "invalid_request",
      detail:
        "Please call the /authorize endpoint with the required parameters.",
      ...searchParams,
    });

    redirect(`/error?${urlParams}`);
  }

  return (
    <div className="flex justify-center items-center h-full w-full px-6">
      <div className="flex flex-grow flex-col max-w-fit">
        <IDKitQR
          scope={scope as string}
          state={state as string}
          nonce={nonce as string}
          client_id={client_id as string}
          redirect_uri={redirect_uri as string}
          response_type={response_type as string}
          response_mode={response_mode as string}
        />
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
