import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { MongoServerError } from "mongodb";
import { AppointmentDocument, AppointmentResponse } from "@/types/salon";
import { DatabaseConfigError, getAppointmentsCollection } from "@/lib/mongodb";
import { validateAppointment } from "@/lib/appointmentValidation";
import { sendBookingNotification } from "@/lib/bookingEmail";

// The MongoDB driver needs Node.js APIs.
export const runtime = "nodejs";

const MAX_BODY_BYTES = 10_000;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

// Unambiguous characters only (no 0/O, 1/I/L), e.g. REI-7K3M-Q9XA.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
function createReferenceCode() {
  const pick = () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  const part = () => Array.from({ length: 4 }, pick).join("");
  return `REI-${part()}-${part()}`;
}

function fail(message: string, status: number) {
  return NextResponse.json<AppointmentResponse>({ success: false, message }, { status });
}

/** Logs an error by type/code only, so connection strings or customer data never reach logs. */
function logError(context: string, err: unknown) {
  const name = err instanceof Error ? err.name : typeof err;
  const code = err instanceof MongoServerError ? ` code=${err.code}` : "";
  console.error(`[appointments] ${context}: ${name}${code}`);
}

export async function POST(request: Request) {
  // 1. Parse a small JSON body.
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return fail("Your request is too large. Please shorten your notes and try again.", 413);
  }
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return fail("Your request is too large. Please shorten your notes and try again.", 413);
    }
    body = JSON.parse(raw);
  } catch {
    return fail("Invalid request. Please refresh the page and try again.", 400);
  }

  // 2. Validate and sanitise every field on the server.
  const result = validateAppointment(body);
  if (!result.ok) return fail(result.message, 400);
  const appointment = result.value;

  // 3. Save to MongoDB before reporting anything to the visitor.
  let collection;
  try {
    collection = await getAppointmentsCollection();
  } catch (err) {
    logError(err instanceof DatabaseConfigError ? "database not configured" : "database connection failed", err);
    return fail(
      "We couldn't save your request right now. Please try again in a few minutes, or message @reillyincolour on Instagram.",
      503
    );
  }

  const now = new Date();
  try {
    const recent = await collection.countDocuments({
      email: appointment.email,
      createdAt: { $gte: new Date(now.getTime() - RATE_LIMIT_WINDOW_MS) },
    });
    if (recent >= RATE_LIMIT_MAX_REQUESTS) {
      return fail(
        "We've received several requests from this email recently. Please wait a little before sending another, or message @reillyincolour on Instagram.",
        429
      );
    }
  } catch (err) {
    logError("rate-limit check failed", err);
    return fail("We couldn't save your request right now. Please try again in a few minutes.", 503);
  }

  let referenceCode = "";
  for (let attempt = 0; attempt < 3 && !referenceCode; attempt++) {
    const candidate = createReferenceCode();
    const doc: AppointmentDocument = {
      referenceCode: candidate,
      ...appointment,
      status: "pending",
      notification: { status: "pending" },
      createdAt: now,
      updatedAt: now,
    };
    // Drop optional fields the visitor left empty rather than storing `undefined`.
    for (const key of ["phone", "hairLength", "notes"] as const) {
      if (doc[key] === undefined) delete doc[key];
    }

    try {
      await collection.insertOne(doc);
      referenceCode = candidate;
    } catch (err) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const index = String((err.errorResponse as { errmsg?: string })?.errmsg ?? err.message);
        if (index.includes("pending_request_unique")) {
          // Same person, same service, same date and time window, still pending: a duplicate.
          const existing = await collection
            .findOne(
              {
                email: appointment.email,
                service: appointment.service,
                requestedDate: appointment.requestedDate,
                requestedTime: appointment.requestedTime,
                status: "pending",
              },
              { projection: { referenceCode: 1 } }
            )
            .catch(() => null);
          return fail(
            existing
              ? `We already have this request (reference ${existing.referenceCode}). Reilly will be in touch, so there's no need to send it again.`
              : "We already have this request. Reilly will be in touch, so there's no need to send it again.",
            409
          );
        }
        continue; // reference code collision: try a fresh code
      }
      logError("insert failed", err);
      return fail("We couldn't save your request right now. Please try again in a few minutes.", 503);
    }
  }
  if (!referenceCode) {
    return fail("We couldn't save your request right now. Please try again in a few minutes.", 503);
  }

  // 4. The request is safely stored. Notify the stylist; a failed email never loses the booking.
  const notification = await sendBookingNotification(appointment, referenceCode);
  try {
    await collection.updateOne(
      { referenceCode },
      {
        $set: {
          notification: {
            status: notification.status,
            attemptedAt: new Date(),
            ...(notification.status === "sent"
              ? { providerId: notification.providerId }
              : { reason: notification.reason }),
          },
          updatedAt: new Date(),
        },
      }
    );
  } catch (err) {
    logError("could not record notification status", err);
  }
  if (notification.status !== "sent") {
    console.warn(`[appointments] ${referenceCode} saved; notification ${notification.status}: ${notification.reason}`);
  }

  return NextResponse.json<AppointmentResponse>(
    {
      success: true,
      referenceNumber: referenceCode,
      emailSent: notification.status === "sent",
      message:
        "Your appointment request has been received. This is not yet a confirmed booking: Reilly reviews every request and will reply by email.",
    },
    { status: 201 }
  );
}
