import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Sign in with World ID • Worldcoin</title>
      </Head>
      <div className="bg-background h-screen">
        <Component {...pageProps} />
      </div>
    </>
  );
}
