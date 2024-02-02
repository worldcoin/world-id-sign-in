import { NextRequest, NextResponse } from "next/server";

export const GET = async (): Promise<NextResponse> => {
  return NextResponse.json({ success: true });
};
