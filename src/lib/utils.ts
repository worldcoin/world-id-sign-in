import { NextResponse } from "next/server";

export const internalRedirect = (
  url: string,
  baseUrl: string
): NextResponse => {
  return NextResponse.redirect(
    // Use canonical URL if available, otherwise use available endpoint
    new URL(url, process.env.NEXT_PUBLIC_URL || baseUrl),
    { status: 303 }
  );
};

export const isMobileDevice = () => {
  if (typeof navigator === "undefined" || !navigator.userAgent) {
    return false; // Ensure navigator and userAgent are defined
  }

  // Define regex patterns for various mobile device types
  // Exclude iPad to show QR code on iPads
  const mobileDeviceRegex =
    /iPhone|iPod|Android|Mobile|BlackBerry|IEMobile|Opera Mini|Windows Phone/i;

  // Check if it's an iPad
  const isIPad = /iPad/i.test(navigator.userAgent);

  return !isIPad && mobileDeviceRegex.test(navigator.userAgent); // Test against user agent, excluding iPads
};

export const isIPad = () => {
  if (typeof navigator === "undefined" || !navigator.userAgent) {
    return false;
  }

  return /iPad/i.test(navigator.userAgent);
};
