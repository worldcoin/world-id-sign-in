import Footer from "@/components/Footer";
import { redirect, useRouter } from "next/navigation";
import { DEVELOPER_PORTAL } from "@/consts";
import dynamic from "next/dynamic";
import IDKitQR from "./IDKitQR";

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const LoginPage = async ({ searchParams }: Props) => {
  const {
    client_id,
    nonce,
    response_type,
    ready,
    redirect_uri,
    scope,
    state,
    response_mode,
    code_challenge,
    code_challenge_method,
  } = searchParams;

  const router = useRouter();

  // If window.WorldApp is defined redirect to /authorize again with the params
  if (window.WorldApp) {
    return router.replace(
      `/authorize?response_type=${response_type}&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&state=${state}&nonce=${nonce}&response_mode=${response_mode}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`
    );
  }

  if (!ready || !client_id) {
    const urlParams = new URLSearchParams({
      code: "invalid_request",
      detail:
        "Please call the /authorize endpoint with the required parameters.",
      ...searchParams,
    });

    redirect(`/error?${urlParams}`);
  }

  const fetchMeta = async (client_id: string) => {
    const res = await fetch(
      new URL(`/api/v1/precheck/${client_id}`, DEVELOPER_PORTAL),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "",
        }),
      }
    );

    return await res.json();
  };

  const app_data = await fetchMeta(client_id as string);

  return (
    <div className="flex justify-center items-center h-full w-full px-6">
      <div className="flex flex-grow flex-col max-w-fit">
        <IDKitQR
          scope={scope as string}
          state={state as string}
          nonce={nonce as string}
          app_data={app_data}
          client_id={client_id as string}
          redirect_uri={redirect_uri as string}
          response_mode={response_mode as string}
          response_type={response_type as string}
          code_challenge={code_challenge as string}
          code_challenge_method={code_challenge_method as string}
        />
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
