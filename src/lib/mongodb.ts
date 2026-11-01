import "server-only";

import { MongoClient, type Collection, type Db } from "mongodb";
import type { AppointmentDocument } from "@/types/salon";

const DB_NAME = "TerrySalonDB";
const APPOINTMENTS_COLLECTION = "appointments";

/*
 * One MongoClient per server process. In development, hot reloads re-evaluate this module,
 * so the client promise is parked on globalThis to avoid opening a new pool on every edit.
 * On Vercel, a warm serverless instance reuses the same pool across requests.
 */
const globalForMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _appointmentIndexesPromise?: Promise<void>;
};

export class DatabaseConfigError extends Error {
  constructor() {
    super("MONGODB_URI is not configured.");
    this.name = "DatabaseConfigError";
  }
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new DatabaseConfigError();

  if (!globalForMongo._mongoClientPromise) {
    const client = new MongoClient(uri, {
      appName: "terry-leeon-website",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    globalForMongo._mongoClientPromise = client.connect().catch((err) => {
      // Let the next request retry instead of caching a failed connection forever.
      globalForMongo._mongoClientPromise = undefined;
      throw err;
    });
  }
  return globalForMongo._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}

/*
 * Indexes back the booking guarantees, so they are ensured once per process:
 * - referenceCode is unique,
 * - the same person cannot hold two identical pending requests (race-safe duplicate guard),
 * - lookups by email + recency stay fast for rate limiting.
 */
async function ensureAppointmentIndexes(collection: Collection<AppointmentDocument>) {
  if (!globalForMongo._appointmentIndexesPromise) {
    globalForMongo._appointmentIndexesPromise = collection
      .createIndexes([
        { key: { referenceCode: 1 }, name: "referenceCode_unique", unique: true },
        {
          key: { email: 1, service: 1, requestedDate: 1, requestedTime: 1 },
          name: "pending_request_unique",
          unique: true,
          partialFilterExpression: { status: "pending" },
        },
        { key: { email: 1, createdAt: -1 }, name: "email_createdAt" },
      ])
      .then(() => undefined)
      .catch((err) => {
        globalForMongo._appointmentIndexesPromise = undefined;
        throw err;
      });
  }
  return globalForMongo._appointmentIndexesPromise;
}

export async function getAppointmentsCollection(): Promise<Collection<AppointmentDocument>> {
  const db = await getDb();
  const collection = db.collection<AppointmentDocument>(APPOINTMENTS_COLLECTION);
  await ensureAppointmentIndexes(collection);
  return collection;
}
