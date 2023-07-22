import clsx from "clsx";
import "@/styles/globals.css";
import { Metadata } from "next";
import DataDog from "./Providers/DataDog";
import PostHog from "./Providers/Posthog";
import { FC, PropsWithChildren } from "react";
import { IBM_Plex_Mono, Rubik, Sora } from "next/font/google";

export const metadata = {
  title: "Sign in with Worldcoin",
} satisfies Metadata;

const sora = Sora({
  style: ["normal"],
  subsets: ["latin"],
  variable: "--font-sora",
  adjustFontFallback: false,
  weight: ["400", "600", "700"],
});

const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  adjustFontFallback: false,
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  style: ["normal"],
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  adjustFontFallback: false,
});

const BaseLayout: FC<PropsWithChildren<{}>> = ({ children }) => (
  <html lang="en">
    <body
      className={clsx(
        sora.variable,
        rubik.variable,
        ibmPlexMono.variable,
        "font-sans bg-background h-screen"
      )}
    >
      {children}
      <PostHog />
      <DataDog />
    </body>
  </html>
);

export default BaseLayout;
