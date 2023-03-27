import { usePostHog } from "@/hooks/usePostHog";
import "@/styles/globals.css";
import { datadogRum } from "@datadog/browser-rum";
import type { AppProps } from "next/app";
import { IBM_Plex_Mono, Rubik, Sora } from "next/font/google";
import Head from "next/head";
import posthog from "posthog-js";
import { useEffect } from "react";

const sora = Sora({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600", "700"],
});

const rubik = Rubik({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  style: ["normal"],
  weight: ["400", "600"],
});

datadogRum.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID as string,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN as string,
  site: process.env.NEXT_PUBLIC_DATADOG_SITE,
  env: process.env.NODE_ENV,
  service: "world-id-sign-in",
  version: "1.0.0",
  sessionSampleRate: 100,
  defaultPrivacyLevel: "mask-user-input",
});

export default function App({ Component, pageProps }: AppProps) {
  usePostHog();

  useEffect(() => {
    // cspell: disable-next-line
    posthog.init("phc_QttqgDbMQDYHX1EMH7FnT6ECBVzdp0kGUq92aQaVQ6I", {
      autocapture: true,
      disable_session_recording: true,
      persistence: "localStorage",
      cross_subdomain_cookie: false,
      sanitize_properties: (props) => {
        if (props?.$current_url) {
          try {
            const currentUrl = new URL(props.$current_url);
            if (currentUrl.searchParams.get("nonce")) {
              currentUrl.searchParams.set("nonce", "redacted");
            }
            if (currentUrl.searchParams.get("state")) {
              currentUrl.searchParams.set("state", "redacted");
            }
            props.$current_url = currentUrl.toString();
          } catch {}
        }
        return props;
      },
    });
  }, []);

  return (
    <>
      <Head>
        <title>Sign in with World ID • Worldcoin</title>
      </Head>
      <div className="bg-background h-screen">
        <Component {...pageProps} />
        <style jsx global>{`
          :root {
            --font-sora: ${sora.style.fontFamily};
            --font-rubik: ${rubik.style.fontFamily};
            --font-mono: ${ibmPlexMono.style.fontFamily};
          }
        `}</style>
      </div>
    </>
  );
}
