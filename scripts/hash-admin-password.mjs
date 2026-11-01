#!/usr/bin/env node
/*
 * Creates the values for the admin login environment variables.
 *
 *   node scripts/hash-admin-password.mjs
 *
 * Type the new admin password when asked (it is not shown on screen). The script prints:
 *   ADMIN_PASSWORD_HASH=...   (a salted scrypt hash; the password itself is never stored)
 *   ADMIN_SESSION_SECRET=...  (a fresh random secret for signing login sessions)
 * Paste both into .env.local (and into Vercel's environment variables for production).
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const N = 32768;
const r = 8;
const p = 1;
const KEY_LENGTH = 64;
const MIN_LENGTH = 12;

function readPasswordFromTerminal(prompt) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Hide typed characters.
    rl._writeToOutput = (text) => {
      if (text.includes(prompt)) rl.output.write(prompt);
    };
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function readPasswordFromPipe() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

const password = process.stdin.isTTY
  ? await readPasswordFromTerminal("New admin password: ")
  : await readPasswordFromPipe();

if (password.length < MIN_LENGTH) {
  console.error(`Password must be at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}

if (process.stdin.isTTY) {
  const confirm = await readPasswordFromTerminal("Repeat password: ");
  if (confirm !== password) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
}

const salt = randomBytes(16);
const hash = scryptSync(password.normalize("NFKC"), salt, KEY_LENGTH, { N, r, p, maxmem: 256 * N * r });

console.log("");
console.log("Add these lines to .env.local (keep them private):");
console.log("");
console.log(`ADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString("base64url")}:${hash.toString("base64url")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(48).toString("base64url")}`);
