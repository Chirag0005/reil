import "server-only";

import type { Filter, Sort, WithId } from "mongodb";
import type {
  AdminAppointment,
  AdminAppointmentStats,
  AdminAppointmentsResponse,
  AppointmentDocument,
  AppointmentStatus,
} from "@/types/salon";
import { getAppointmentsCollection } from "./mongodb";
import { sendCustomerDecisionEmail } from "./bookingEmail";

export const STATUS_FILTERS = ["all", "pending", "approved", "rejected"] as const;
export const SORT_OPTIONS = ["newest", "oldest", "date-asc", "date-desc"] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];
export type SortOption = (typeof SORT_OPTIONS)[number];

export const PAGE_SIZE = 20;
// New codes use REI-; TLH- codes from before the rebrand stay valid.
export const REFERENCE_PATTERN = /^(REI|TLH)-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

const SORTS: Record<SortOption, Sort> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  "date-asc": { requestedDate: 1, createdAt: 1 },
  "date-desc": { requestedDate: -1, createdAt: -1 },
};

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Database document → dashboard DTO. Only the fields the dashboard needs leave the server. */
function toAdminAppointment(doc: WithId<AppointmentDocument> | AppointmentDocument): AdminAppointment {
  return {
    referenceCode: doc.referenceCode,
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone,
    service: doc.service,
    requestedDate: doc.requestedDate,
    requestedTime: doc.requestedTime,
    hairLength: doc.hairLength,
    notes: doc.notes,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    decidedAt: doc.decidedAt?.toISOString(),
    terryNotification: doc.notification?.status ?? "pending",
    customerNotification: doc.customerNotification
      ? { status: doc.customerNotification.status, reason: doc.customerNotification.reason }
      : undefined,
  };
}

export async function getAppointmentStats(): Promise<AdminAppointmentStats> {
  const col = await getAppointmentsCollection();
  const rows = await col
    .aggregate<{ _id: AppointmentStatus; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }])
    .toArray();
  const stats: AdminAppointmentStats = { total: 0, pending: 0, approved: 0, rejected: 0 };
  for (const row of rows) {
    stats.total += row.n;
    if (row._id === "pending" || row._id === "approved" || row._id === "rejected") stats[row._id] += row.n;
  }
  return stats;
}

export async function listAppointments(options: {
  status: StatusFilter;
  query: string;
  sort: SortOption;
  page: number;
}): Promise<AdminAppointmentsResponse> {
  const col = await getAppointmentsCollection();
  const filter: Filter<AppointmentDocument> = {};
  if (options.status !== "all") filter.status = options.status;
  if (options.query) {
    const pattern = new RegExp(escapeRegex(options.query), "i");
    filter.$or = [{ fullName: pattern }, { email: pattern }, { referenceCode: pattern }];
  }

  const [docs, total, stats] = await Promise.all([
    col
      .find(filter)
      .sort(SORTS[options.sort])
      .skip((options.page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .toArray(),
    col.countDocuments(filter),
    getAppointmentStats(),
  ]);

  return { items: docs.map(toAdminAppointment), total, page: options.page, pageSize: PAGE_SIZE, stats };
}

export type DecisionResult =
  | { ok: true; appointment: AdminAppointment }
  | { ok: false; reason: "not_found" | "already_decided"; currentStatus?: AppointmentStatus };

/**
 * pending → approved | rejected, as one atomic update. Only the request that actually flips the
 * status sends the customer email, so repeating an action (double click, second tab, replayed
 * request) can never send a second email. Email failure is recorded but never undoes the decision.
 */
export async function decideAppointment(referenceCode: string, decision: "approved" | "rejected"): Promise<DecisionResult> {
  const col = await getAppointmentsCollection();
  const now = new Date();

  const updated = await col.findOneAndUpdate(
    { referenceCode, status: "pending" },
    {
      $set: {
        status: decision,
        decidedAt: now,
        updatedAt: now,
        customerNotification: { status: "pending" },
      },
    },
    { returnDocument: "after" }
  );

  if (!updated) {
    const existing = await col.findOne({ referenceCode }, { projection: { status: 1 } });
    return existing
      ? { ok: false, reason: "already_decided", currentStatus: existing.status }
      : { ok: false, reason: "not_found" };
  }

  const email = await sendCustomerDecisionEmail(updated, decision);
  const customerNotification = {
    status: email.status,
    attemptedAt: new Date(),
    ...(email.status === "sent" ? { providerId: email.providerId } : { reason: email.reason }),
  };
  try {
    await col.updateOne({ referenceCode }, { $set: { customerNotification, updatedAt: new Date() } });
    updated.customerNotification = customerNotification;
  } catch {
    // The decision itself is already saved; only the email bookkeeping failed.
    console.error(`[admin] ${referenceCode}: could not record customer email status`);
    updated.customerNotification = customerNotification;
  }

  return { ok: true, appointment: toAdminAppointment(updated) };
}
