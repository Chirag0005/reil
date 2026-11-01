import { NextResponse } from "next/server";
import { getAdminSessionFromRequest, isSameOriginRequest } from "@/lib/adminAuth";
import { REFERENCE_PATTERN, decideAppointment } from "@/lib/adminAppointments";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function fail(status: number, message: string) {
  return NextResponse.json({ success: false, message }, { status, headers: NO_STORE });
}

/** Approve or reject a pending request: PATCH { action: "approve" | "reject" } */
export async function PATCH(request: Request, { params }: { params: Promise<{ ref: string }> }) {
  if (!(await getAdminSessionFromRequest())) return fail(401, "Your session has ended. Please sign in again.");
  if (!isSameOriginRequest(request)) return fail(403, "Request not allowed.");

  const { ref } = await params;
  const referenceCode = decodeURIComponent(ref).toUpperCase();
  if (!REFERENCE_PATTERN.test(referenceCode)) return fail(400, "Invalid reference code.");

  let action: unknown;
  try {
    action = (await request.json())?.action;
  } catch {
    return fail(400, "Invalid request.");
  }
  if (action !== "approve" && action !== "reject") return fail(400, "Unknown action.");

  try {
    const result = await decideAppointment(referenceCode, action === "approve" ? "approved" : "rejected");
    if (!result.ok) {
      return result.reason === "not_found"
        ? fail(404, "This appointment request no longer exists.")
        : fail(409, `This request has already been ${result.currentStatus}. Refresh to see the latest status.`);
    }
    return NextResponse.json({ success: true, appointment: result.appointment }, { headers: NO_STORE });
  } catch (err) {
    console.error(`[admin] status update failed for ${referenceCode}: ${err instanceof Error ? err.name : "UnknownError"}`);
    return fail(503, "The database couldn't be updated, so nothing was changed. Please try again.");
  }
}
