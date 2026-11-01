import "server-only";

import { Resend } from "resend";
import type { CleanAppointment } from "./appointmentValidation";

export type NotificationResult =
  | { status: "sent"; providerId?: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  flexible: "Flexible / Any available time",
};

const HAIR_LABELS: Record<string, string> = {
  short: "Above shoulders",
  medium: "Collarbone",
  long: "Mid-back",
  "extra-long": "Past mid-back",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #F7F2EA;color:#817064;font-size:13px;width:42%;vertical-align:top">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #F7F2EA;color:#30231F;font-size:14px;font-weight:600;text-align:right">${escapeHtml(value)}</td>
  </tr>`;
}

function buildHtml(a: CleanAppointment, referenceCode: string) {
  const notes = a.notes
    ? `<div style="background:#F7F2EA;border-left:3px solid #A98563;padding:14px;margin-top:20px;font-size:13px;line-height:1.55;color:#30231F">
         <strong>Client notes / colour history</strong><br/>${escapeHtml(a.notes).replace(/\n/g, "<br/>")}
       </div>`
    : "";
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#F7F2EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#30231F">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #EAE0D3;padding:32px">
    <p style="margin:0 0 6px;color:#A98563;font-size:11px;letter-spacing:0.18em;text-transform:uppercase">Reilly Gray @ Boheme · Salon Boheme</p>
    <h1 style="margin:0 0 6px;font-size:22px;font-weight:400">New appointment request</h1>
    <p style="margin:0 0 20px;color:#817064;font-size:13px">Status: pending your review. Nothing has been confirmed with the client yet.</p>
    <table role="presentation" style="width:100%;border-collapse:collapse">
      ${row("Reference", referenceCode)}
      ${row("Client name", a.fullName)}
      ${row("Email", a.email)}
      ${row("Phone", a.phone ?? "Not provided")}
      ${row("Requested service", a.service)}
      ${row("Preferred date", a.requestedDate)}
      ${row("Time window", TIME_LABELS[a.requestedTime] ?? a.requestedTime)}
      ${row("Hair length", a.hairLength ? HAIR_LABELS[a.hairLength] ?? a.hairLength : "Not specified")}
    </table>
    ${notes}
    <p style="margin:24px 0 0;font-size:11px;color:#817064;text-align:center">
      Sent from the Reilly Gray @ Boheme website. Reply to this email to respond to the client directly.
    </p>
  </div>
</body></html>`;
}

function buildText(a: CleanAppointment, referenceCode: string) {
  return [
    "New appointment request (pending your review)",
    "",
    `Reference: ${referenceCode}`,
    `Client name: ${a.fullName}`,
    `Email: ${a.email}`,
    `Phone: ${a.phone ?? "Not provided"}`,
    `Requested service: ${a.service}`,
    `Preferred date: ${a.requestedDate}`,
    `Time window: ${TIME_LABELS[a.requestedTime] ?? a.requestedTime}`,
    `Hair length: ${a.hairLength ? HAIR_LABELS[a.hairLength] ?? a.hairLength : "Not specified"}`,
    a.notes ? `\nClient notes:\n${a.notes}` : "",
  ].join("\n");
}

/** Notifies the stylist of a saved request. Never throws: the caller records the outcome. */
export async function sendBookingNotification(
  appointment: CleanAppointment,
  referenceCode: string
): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.BOOKING_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !to) {
    return { status: "skipped", reason: "Email settings are not configured on the server." };
  }

  try {
    const resend = new Resend(apiKey);
    // Subject is plain text, but strip line breaks so it can't be split into extra headers.
    const subjectName = appointment.fullName.replace(/[\r\n]/g, " ");
    const { data, error } = await resend.emails.send({
      from,
      to,
      replyTo: appointment.email,
      subject: `New appointment request: ${subjectName} [${referenceCode}]`,
      html: buildHtml(appointment, referenceCode),
      text: buildText(appointment, referenceCode),
    });
    if (error) {
      return { status: "failed", reason: `Resend rejected the email (${error.name}).` };
    }
    return { status: "sent", providerId: data?.id };
  } catch (err) {
    const name = err instanceof Error ? err.name : "UnknownError";
    return { status: "failed", reason: `Email request failed (${name}).` };
  }
}

/* ---------- Customer emails after the stylist's decision ---------- */

interface DecisionRecipient {
  referenceCode: string;
  fullName: string;
  email: string;
  service: string;
  requestedDate: string;
  requestedTime: string;
}

function formatRequestedDate(isoDate: string) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return new Intl.DateTimeFormat("en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function decisionContent(a: DecisionRecipient, decision: "approved" | "rejected") {
  const firstName = a.fullName.split(" ")[0] || a.fullName;
  const when = `${formatRequestedDate(a.requestedDate)}, ${TIME_LABELS[a.requestedTime] ?? a.requestedTime}`;
  if (decision === "approved") {
    return {
      subject: `Your appointment request is approved · Reilly Gray @ Boheme [${a.referenceCode}]`,
      heading: "Your request has been approved",
      paragraphs: [
        `Hi ${firstName},`,
        `Thank you for choosing Reilly Gray @ Boheme. Reilly has approved your request for ${a.service} on ${when}.`,
        "Reilly will be in touch to confirm the exact start time at Salon Boheme in Dieppe. If anything changes on your side, simply reply to this email.",
      ],
    };
  }
  return {
    subject: `About your appointment request · Reilly Gray @ Boheme [${a.referenceCode}]`,
    heading: "About your appointment request",
    paragraphs: [
      `Hi ${firstName},`,
      `Thank you for your interest in Reilly Gray @ Boheme. Unfortunately, Reilly isn't able to accommodate your request for ${a.service} on ${when}.`,
      "You're very welcome to reply to this email or send a new request for another date, and we will do our best to find a time that suits you.",
    ],
  };
}

/** Tells the customer about the stylist's decision. Never throws: the caller records the outcome. */
export async function sendCustomerDecisionEmail(
  appointment: DecisionRecipient,
  decision: "approved" | "rejected"
): Promise<NotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const replyTo = process.env.BOOKING_NOTIFICATION_EMAIL;
  if (!apiKey || !from) {
    return { status: "skipped", reason: "Email settings are not configured on the server." };
  }

  const content = decisionContent(appointment, decision);
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#F7F2EA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#30231F">
  <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #EAE0D3;padding:32px">
    <p style="margin:0 0 6px;color:#A98563;font-size:11px;letter-spacing:0.18em;text-transform:uppercase">Reilly Gray @ Boheme · Dieppe</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:400">${escapeHtml(content.heading)}</h1>
    ${content.paragraphs
      .map((p) => `<p style="margin:0 0 14px;font-size:14px;line-height:1.6">${escapeHtml(p)}</p>`)
      .join("\n    ")}
    <p style="margin:20px 0 0;font-size:12px;color:#817064">Reference: ${escapeHtml(appointment.referenceCode)}</p>
  </div>
</body></html>`;

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: appointment.email,
      ...(replyTo ? { replyTo } : {}),
      subject: content.subject.replace(/[\r\n]/g, " "),
      html,
      text: [content.heading, "", ...content.paragraphs, "", `Reference: ${appointment.referenceCode}`].join("\n"),
    });
    if (error) {
      return { status: "failed", reason: `Resend rejected the email (${error.name}).` };
    }
    return { status: "sent", providerId: data?.id };
  } catch (err) {
    const name = err instanceof Error ? err.name : "UnknownError";
    return { status: "failed", reason: `Email request failed (${name}).` };
  }
}
