import clsx from "clsx";
import "@/styles/globals.css";
import { Metadata } from "next";
import { PostHog } from "@/providers/posthog";
import { FC, PropsWithChildren } from "react";
import { IBM_Plex_Mono, Rubik, Sora } from "next/font/google";

export const metadata = {
  title: "Sign in with Worldcoin",

  icons: [
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: "/favicon/apple-touch-icon.png",
    },
    {
      url: "/favicon/favicon-32x32.png",
      type: "image/png",
      sizes: "32x32",
      rel: "icon",
    },
    {
      url: "/favicon/favicon-16x16.png",
      type: "image/png",
      sizes: "16x16",
      rel: "icon",
    },
    {
      url: "/favicon/site.webmanifest",
      rel: "manifest",
    },
    {
      url: "/favicon/safari-pinned-tab.svg",
      rel: "mask-icon",
    },
  ],
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
    </body>
  </html>
);

export default BaseLayout;
