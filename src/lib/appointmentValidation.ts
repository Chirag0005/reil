import "server-only";

/*
 * Server-side validation and sanitising for appointment requests.
 * The browser form validates too, but only these rules are trusted.
 */

export const TIME_WINDOWS = ["morning", "midday", "afternoon", "flexible"] as const;
export const HAIR_LENGTHS = ["short", "medium", "long", "extra-long"] as const;

// Salon Bohème, Dieppe NB (Atlantic time).
const STUDIO_TIMEZONE = "America/Moncton";
const MAX_DAYS_AHEAD = 365;

export interface CleanAppointment {
  fullName: string;
  email: string;
  phone?: string;
  service: string;
  requestedDate: string;
  requestedTime: (typeof TIME_WINDOWS)[number];
  hairLength?: (typeof HAIR_LENGTHS)[number];
  notes?: string;
}

export type ValidationResult =
  | { ok: true; value: CleanAppointment }
  | { ok: false; field: string; message: string };

// Control characters (except newline/tab, which multi-line notes may keep) and invisible
// bidi/zero-width marks that can be used to disguise text in emails.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;

function cleanLine(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.normalize("NFC").replace(CONTROL_CHARS, "").replace(/\s+/g, " ").trim();
}

function cleanMultiline(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARS, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function isBlank(value: unknown) {
  return value === undefined || value === null || (typeof value === "string" && value.trim() === "");
}

/** Today's date at the salon as YYYY-MM-DD (Vercel servers run in UTC). */
function studioToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isRealDate(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const d = new Date(`${isoDate}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === isoDate;
}

const EMAIL_PATTERN = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[A-Za-z]{2,}$/;
const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}' .-]*$/u;
const PHONE_PATTERN = /^[+()\-\s.\d]+$/;

export function validateAppointment(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, field: "form", message: "Invalid request. Please refresh the page and try again." };
  }
  const body = input as Record<string, unknown>;

  const fullName = cleanLine(body.fullName);
  if (!fullName || fullName.length < 2) {
    return { ok: false, field: "fullName", message: "Please enter your full name (minimum 2 characters)." };
  }
  if (fullName.length > 80 || !NAME_PATTERN.test(fullName)) {
    return { ok: false, field: "fullName", message: "Please enter your name using letters only (up to 80 characters)." };
  }

  const email = cleanLine(body.email)?.toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, field: "email", message: "Please enter a valid email address so Reilly can respond to your request." };
  }

  let phone: string | undefined;
  if (!isBlank(body.phone)) {
    const cleaned = cleanLine(body.phone);
    const digits = cleaned?.replace(/\D/g, "") ?? "";
    if (!cleaned || cleaned.length > 25 || !PHONE_PATTERN.test(cleaned) || digits.length < 6 || digits.length > 15) {
      return { ok: false, field: "phone", message: "Please enter a valid phone number, or leave it blank." };
    }
    phone = cleaned;
  }

  // Free text on purpose: booking buttons pre-fill specific services and looks.
  const service = cleanLine(body.service);
  if (!service || service.length < 2) {
    return { ok: false, field: "service", message: "Please select a preferred hairstyling or colour service." };
  }
  if (service.length > 120) {
    return { ok: false, field: "service", message: "Please choose a service from the list." };
  }

  const requestedDate = cleanLine(body.preferredDate);
  if (!requestedDate || !isRealDate(requestedDate)) {
    return { ok: false, field: "preferredDate", message: "Please select your preferred appointment date." };
  }
  const today = studioToday();
  if (requestedDate < today) {
    return { ok: false, field: "preferredDate", message: "Preferred date must be today or a future date." };
  }
  if (requestedDate > addDays(today, MAX_DAYS_AHEAD)) {
    return { ok: false, field: "preferredDate", message: "Please choose a date within the next 12 months." };
  }

  const requestedTime = cleanLine(body.preferredTime);
  if (!requestedTime || !(TIME_WINDOWS as readonly string[]).includes(requestedTime)) {
    return { ok: false, field: "preferredTime", message: "Please choose a preferred time window." };
  }

  let hairLength: CleanAppointment["hairLength"];
  if (!isBlank(body.hairLength)) {
    const cleaned = cleanLine(body.hairLength);
    if (!cleaned || !(HAIR_LENGTHS as readonly string[]).includes(cleaned)) {
      return { ok: false, field: "hairLength", message: "Please choose your current hair length." };
    }
    hairLength = cleaned as CleanAppointment["hairLength"];
  }

  let notes: string | undefined;
  if (!isBlank(body.notes)) {
    const cleaned = cleanMultiline(body.notes);
    if (cleaned && cleaned.length > 1500) {
      return { ok: false, field: "notes", message: "Please keep your notes under 1,500 characters." };
    }
    notes = cleaned || undefined;
  }

  return {
    ok: true,
    value: {
      fullName,
      email,
      phone,
      service,
      requestedDate,
      requestedTime: requestedTime as CleanAppointment["requestedTime"],
      hairLength,
      notes,
    },
  };
}
