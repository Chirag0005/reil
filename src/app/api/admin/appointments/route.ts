import { NextResponse, type NextRequest } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";
import { SORT_OPTIONS, STATUS_FILTERS, listAppointments, type SortOption, type StatusFilter } from "@/lib/adminAppointments";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  if (!(await getAdminSessionFromRequest())) {
    return NextResponse.json({ message: "Your session has ended. Please sign in again." }, { status: 401, headers: NO_STORE });
  }

  const params = request.nextUrl.searchParams;
  const statusParam = params.get("status") ?? "all";
  const sortParam = params.get("sort") ?? "newest";
  const status = (STATUS_FILTERS as readonly string[]).includes(statusParam) ? (statusParam as StatusFilter) : "all";
  const sort = (SORT_OPTIONS as readonly string[]).includes(sortParam) ? (sortParam as SortOption) : "newest";
  const query = (params.get("q") ?? "").trim().slice(0, 100);
  const page = Math.min(Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1), 1000);

  try {
    const data = await listAppointments({ status, query, sort, page });
    return NextResponse.json(data, { headers: NO_STORE });
  } catch (err) {
    console.error(`[admin] list appointments failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return NextResponse.json(
      { message: "Couldn't load appointments from the database. Please try again." },
      { status: 503, headers: NO_STORE }
    );
  }
}
