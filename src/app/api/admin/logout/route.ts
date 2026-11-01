import { NextResponse } from "next/server";
import { SESSION_COOKIE, isSameOriginRequest, sessionCookieOptions } from "@/lib/adminAuth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ success: false, message: "Request not allowed." }, { status: 403 });
  }
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  return response;
}
