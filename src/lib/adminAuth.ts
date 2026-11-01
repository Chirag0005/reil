import "server-only";

import { createHash, createHmac, scrypt, timingSafeEqual, type BinaryLike, type ScryptOptions } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/*
 * Single-administrator authentication for the HAIR BY REI dashboard.
 *
 * - Credentials live only in environment variables: ADMIN_EMAIL and ADMIN_PASSWORD_HASH
 *   (a salted scrypt hash produced by scripts/hash-admin-password.mjs; the plain password is
 *   never stored anywhere).
 * - Sessions are stateless: an HMAC-SHA256-signed token (ADMIN_SESSION_SECRET) in an HTTP-only,
 *   SameSite=Strict cookie that expires after SESSION_TTL_SECONDS. Changing the password or the
 *   secret invalidates every existing session.
 * - Every admin page and API calls one of the verify helpers below; nothing relies on layouts.
 */

export const SESSION_COOKIE = "tlh_admin_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

interface SessionPayload {
  sub: string; // admin email
  iat: number; // issued at (seconds)
  exp: number; // expires at (seconds)
  pv: string; // password-hash fingerprint: rotates sessions when the password changes
}

export interface AdminSession {
  email: string;
  expiresAt: number;
}

export class AdminConfigError extends Error {
  constructor(detail: string) {
    super(`Admin authentication is not configured: ${detail}`);
    this.name = "AdminConfigError";
  }
}

interface AdminConfig {
  email: string;
  passwordHash: string;
  secret: string;
}

function getConfig(): AdminConfig {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!email) throw new AdminConfigError("ADMIN_EMAIL is missing");
  if (!passwordHash || !passwordHash.startsWith("scrypt:")) {
    throw new AdminConfigError("ADMIN_PASSWORD_HASH is missing or not a scrypt hash");
  }
  if (!secret || secret.length < 32) {
    throw new AdminConfigError("ADMIN_SESSION_SECRET must be at least 32 characters");
  }
  return { email, passwordHash, secret };
}

/* ---------- Password verification ---------- */

function scryptAsync(password: BinaryLike, salt: BinaryLike, keylen: number, options: ScryptOptions) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

// Format: scrypt:<N>:<r>:<p>:<salt base64url>:<hash base64url>  (no "$", which .env files expand)
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltB64, hashB64] = parts;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (![N, r, p].every((v) => Number.isInteger(v) && v > 0)) return false;
  const expected = Buffer.from(hashB64, "base64url");
  const actual = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltB64, "base64url"), expected.length, {
    N,
    r,
    p,
    maxmem: 256 * N * r,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function sameText(a: string, b: string) {
  // Compare digests so the comparison takes the same time regardless of where strings differ.
  const da = createHash("sha256").update(a).digest();
  const db = createHash("sha256").update(b).digest();
  return timingSafeEqual(da, db);
}

/** Checks a login attempt. Always runs the password hash so timing doesn't reveal the email. */
export async function checkAdminCredentials(email: string, password: string): Promise<boolean> {
  const config = getConfig();
  const emailMatches = sameText(email.trim().toLowerCase(), config.email);
  const passwordMatches = await verifyPassword(password, config.passwordHash);
  return emailMatches && passwordMatches;
}

/* ---------- Session tokens ---------- */

function passwordFingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

function sign(data: string, secret: string) {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSessionToken(): { token: string; expiresAt: number } {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: config.email,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    pv: passwordFingerprint(config.passwordHash),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { token: `${body}.${sign(body, config.secret)}`, expiresAt: payload.exp };
}

export function verifySessionToken(token: string | undefined): AdminSession | null {
  if (!token) return null;
  let config: AdminConfig;
  try {
    config = getConfig();
  } catch {
    return null;
  }
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(body, config.secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp <= now) return null;
  if (payload.sub !== config.email) return null;
  if (payload.pv !== passwordFingerprint(config.passwordHash)) return null;
  return { email: payload.sub, expiresAt: payload.exp };
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

/* ---------- Verification helpers (the Data Access Layer's gate) ---------- */

/** For Server Components: returns the session, or redirects to the login page. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");
  return session;
}

/** For Server Components that only need to know (e.g. the login page). */
export async function getAdminSession(): Promise<AdminSession | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** For Route Handlers: the session, or null (caller returns 401). */
export async function getAdminSessionFromRequest(): Promise<AdminSession | null> {
  return verifySessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/**
 * Rejects cross-site state-changing requests (defence in depth on top of SameSite=Strict):
 * the Origin header, which browsers always send on POST/PATCH, must match this site.
 */
export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Best-effort client IP for login rate limiting (Vercel sets x-forwarded-for). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
