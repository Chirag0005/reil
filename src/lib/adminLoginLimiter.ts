import "server-only";

import { createHash } from "node:crypto";
import { getDb } from "./mongodb";

/*
 * Brute-force protection for the admin login. Failed attempts are stored in
 * TerrySalonDB.adminLoginAttempts (security data only, no appointment data) and expire
 * automatically through a TTL index. Stored keys are hashed IPs, never raw addresses.
 * Shared storage is used because in-memory counters reset on every Vercel instance.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_GLOBAL = 50;

interface LoginAttempt {
  ipHash: string;
  createdAt: Date;
}

const globalForLimiter = globalThis as typeof globalThis & { _loginAttemptIndexes?: Promise<void> };

async function collection() {
  const col = (await getDb()).collection<LoginAttempt>("adminLoginAttempts");
  if (!globalForLimiter._loginAttemptIndexes) {
    globalForLimiter._loginAttemptIndexes = col
      .createIndexes([
        { key: { createdAt: 1 }, name: "expire_after_window", expireAfterSeconds: WINDOW_MS / 1000 },
        { key: { ipHash: 1, createdAt: -1 }, name: "ipHash_createdAt" },
      ])
      .then(() => undefined)
      .catch((err) => {
        globalForLimiter._loginAttemptIndexes = undefined;
        throw err;
      });
  }
  await globalForLimiter._loginAttemptIndexes;
  return col;
}

function hashIp(ip: string) {
  return createHash("sha256").update(`tlh-admin:${ip}`).digest("hex");
}

/** True when this IP (or the site as a whole) has too many recent failures. */
export async function isLoginBlocked(ip: string): Promise<boolean> {
  const col = await collection();
  const since = new Date(Date.now() - WINDOW_MS);
  const [forIp, overall] = await Promise.all([
    col.countDocuments({ ipHash: hashIp(ip), createdAt: { $gte: since } }),
    col.countDocuments({ createdAt: { $gte: since } }),
  ]);
  return forIp >= MAX_FAILURES_PER_IP || overall >= MAX_FAILURES_GLOBAL;
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const col = await collection();
  await col.insertOne({ ipHash: hashIp(ip), createdAt: new Date() });
}

export async function clearLoginFailures(ip: string): Promise<void> {
  const col = await collection();
  await col.deleteMany({ ipHash: hashIp(ip) });
}
