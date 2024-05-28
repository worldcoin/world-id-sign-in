import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  let url = new URL("/authorize", process.env.NEXT_PUBLIC_URL);
  url.search = new URL(req.url).searchParams.toString();

  let res = NextResponse.redirect(url, {
    status: 303,
    headers: { "Set-Cookie": `web-only=true` },
  });

  return res;
};
