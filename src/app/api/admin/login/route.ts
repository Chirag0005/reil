import { NextResponse } from "next/server";
import {
  AdminConfigError,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  checkAdminCredentials,
  clientIp,
  createSessionToken,
  isSameOriginRequest,
  sessionCookieOptions,
} from "@/lib/adminAuth";
import { clearLoginFailures, isLoginBlocked, recordLoginFailure } from "@/lib/adminLoginLimiter";

export const runtime = "nodejs";

const GENERIC_FAILURE = "The email or password is incorrect.";

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return json(403, { success: false, message: "Request not allowed." });

  let email = "";
  let password = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.slice(0, 254) : "";
    password = typeof body?.password === "string" ? body.password.slice(0, 200) : "";
  } catch {
    return json(400, { success: false, message: "Invalid request." });
  }
  if (!email || !password) return json(400, { success: false, message: "Please enter your email and password." });

  const ip = clientIp(request);
  try {
    if (await isLoginBlocked(ip)) {
      return json(429, { success: false, message: "Too many attempts. Please wait 15 minutes and try again." });
    }

    const valid = await checkAdminCredentials(email, password);
    if (!valid) {
      await recordLoginFailure(ip);
      return json(401, { success: false, message: GENERIC_FAILURE });
    }

    await clearLoginFailures(ip);
    const { token } = createSessionToken();
    const response = json(200, { success: true });
    response.cookies.set(SESSION_COOKIE, token, { ...sessionCookieOptions, maxAge: SESSION_TTL_SECONDS });
    return response;
  } catch (err) {
    if (err instanceof AdminConfigError) {
      console.error(`[admin] login unavailable: ${err.message}`);
      return json(503, { success: false, message: "Admin login is not configured on the server." });
    }
    console.error(`[admin] login failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return json(503, { success: false, message: "Login is temporarily unavailable. Please try again shortly." });
  }
}
