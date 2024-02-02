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
