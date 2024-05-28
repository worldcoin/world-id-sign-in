import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const GET = async (req: NextRequest): Promise<NextResponse> => {
  let url = new URL(req.url);
  url.pathname = "/authorize";

  let res = NextResponse.redirect(url, {
    status: 303,
    headers: { "Set-Cookie": `web-only=true` },
  });

  return res;
};
