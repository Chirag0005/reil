"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Inbox,
  Loader2,
  LogOut,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Ruler,
  Scissors,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import type { AdminAppointment, AdminAppointmentsResponse, AppointmentStatus } from "@/types/salon";

type StatusFilter = "all" | AppointmentStatus;
type SortOption = "newest" | "oldest" | "date-asc" | "date-desc";
type Action = "approve" | "reject";

interface Toast {
  id: number;
  tone: "success" | "error" | "info";
  text: string;
}

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  midday: "Midday",
  afternoon: "Afternoon",
  flexible: "Flexible",
};

const HAIR_LABELS: Record<string, string> = {
  short: "Above shoulders",
  medium: "Collarbone",
  long: "Mid-back",
  "extra-long": "Past mid-back",
};

const STATUS_STYLES: Record<AppointmentStatus, { label: string; className: string; dot: string }> = {
  pending: { label: "Pending", className: "bg-[#F3EADB] text-[#7A5A33] border-[#E5D3B8]", dot: "bg-[#C39A62]" },
  approved: { label: "Approved", className: "bg-[#E6EDE1] text-[#3E5A36] border-[#CFDCC7]", dot: "bg-[#6E8F62]" },
  rejected: { label: "Rejected", className: "bg-[#F4E4E0] text-[#8A3B2E] border-[#E8CBC4]", dot: "bg-[#B2604F]" },
};

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const SORTS: { id: SortOption; label: string }[] = [
  { id: "newest", label: "Newest request" },
  { id: "oldest", label: "Oldest request" },
  { id: "date-asc", label: "Appointment date · soonest" },
  { id: "date-desc", label: "Appointment date · latest" },
];

function formatRequestedDate(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-CA", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

function formatSubmitted(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Moncton",
  }).format(new Date(iso));
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-[10px] uppercase tracking-[0.18em] font-medium ${s.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  );
}

function emailStatusText(status?: string, reason?: string) {
  switch (status) {
    case "sent":
      return "Sent";
    case "failed":
      return `Not delivered${reason ? `: ${reason}` : ""}`;
    case "skipped":
      return "Not sent (email not configured)";
    case "pending":
      return "Sending…";
    default:
      return "Not sent";
  }
}

export default function AppointmentsDashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<AdminAppointmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<AdminAppointment | null>(null);
  const [processing, setProcessing] = useState<{ ref: string; action: Action } | null>(null);
  const [confirmReject, setConfirmReject] = useState<AdminAppointment | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  const toastId = useRef(0);
  const notify = useCallback((tone: Toast["tone"], text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, tone, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const goToLogin = useCallback(() => {
    router.replace("/admin/login");
    router.refresh();
  }, [router]);

  // Debounce search typing; any filter change returns to page 1.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [queryInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ status, sort, page: String(page) });
    if (query) params.set("q", query);

    // Loading flags are set from the async callback so the effect body itself stays pure.
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError("");
        return fetch(`/api/admin/appointments?${params}`, { cache: "no-store", signal: controller.signal });
      })
      .then(async (res) => {
        if (res.status === 401) return goToLogin();
        const body = await res.json().catch(() => null);
        if (!res.ok || !body) throw new Error(body?.message || "Couldn't load appointments.");
        setData(body as AdminAppointmentsResponse);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error && err.message !== "Failed to fetch" ? err.message : "Couldn't reach the server. Check your connection and try again.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [status, query, sort, page, reloadKey, goToLogin]);

  const refresh = () => setReloadKey((k) => k + 1);

  const decide = async (appointment: AdminAppointment, action: Action) => {
    setProcessing({ ref: appointment.referenceCode, action });
    try {
      const res = await fetch(`/api/admin/appointments/${encodeURIComponent(appointment.referenceCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) return goToLogin();
      const body = (await res.json().catch(() => null)) as
        | { success: true; appointment: AdminAppointment }
        | { success: false; message?: string }
        | null;

      if (!res.ok || !body?.success) {
        notify("error", (body && "message" in body && body.message) || "The status couldn't be updated. Nothing was changed.");
        refresh();
        return;
      }

      const updated = body.appointment;
      const verb = action === "approve" ? "approved" : "rejected";
      const email = updated.customerNotification;
      notify(
        "success",
        email?.status === "sent"
          ? `${updated.fullName}'s request was ${verb}. They've been emailed.`
          : `${updated.fullName}'s request was ${verb}, but the customer email couldn't be sent${email?.reason ? ` (${email.reason.replace(/\.$/, "")})` : ""}. Please contact them directly.`
      );
      setSelected((s) => (s?.referenceCode === updated.referenceCode ? updated : s));
      refresh();
    } catch {
      notify("error", "Couldn't reach the server. Refresh to check whether the status changed before trying again.");
    } finally {
      setProcessing(null);
      setConfirmReject(null);
    }
  };

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      goToLogin();
    }
  };

  const stats = data?.stats;
  const items = data?.items ?? [];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-[#F7F2EA]/95 backdrop-blur-md border-b border-[#EAE0D3]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-serif text-lg sm:text-2xl tracking-[0.14em] sm:tracking-[0.2em] font-light whitespace-nowrap">HAIR BY REI</span>
            <span className="px-2 py-0.5 border border-[#A98563]/50 text-[9px] uppercase tracking-[0.28em] text-[#A98563] font-medium">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <span className="hidden md:inline text-xs text-[#817064] truncate max-w-[220px]" title={adminEmail}>
              {adminEmail}
            </span>
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[#30231F]/80 hover:text-[#30231F] transition-colors"
            >
              Website <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 border border-[#30231F]/20 text-[11px] uppercase tracking-[0.18em] whitespace-nowrap hover:bg-[#30231F] hover:text-[#F7F2EA] transition-colors duration-300 disabled:opacity-60"
            >
              {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-8 sm:py-12">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A98563] font-medium mb-2">Bookings</p>
            <h1 className="font-serif text-3xl sm:text-5xl font-light leading-tight">Appointment Requests</h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-[#30231F]/80 hover:text-[#30231F] py-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Live statistics */}
        <section aria-label="Statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {(
            [
              { id: "all", label: "Total requests", value: stats?.total },
              { id: "pending", label: "Pending", value: stats?.pending },
              { id: "approved", label: "Approved", value: stats?.approved },
              { id: "rejected", label: "Rejected", value: stats?.rejected },
            ] as { id: StatusFilter; label: string; value?: number }[]
          ).map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setStatus(card.id);
                setPage(1);
              }}
              aria-pressed={status === card.id}
              className={`group text-left bg-white border p-4 sm:p-6 transition-[border-color,box-shadow] duration-300 hover:shadow-[0_20px_40px_-32px_rgba(48,35,31,0.5)] ${
                status === card.id ? "border-[#A98563]" : "border-[#EAE0D3] hover:border-[#A98563]/50"
              }`}
            >
              <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-[#817064]">
                {card.label}
                {card.id !== "all" && <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[card.id as AppointmentStatus].dot}`} />}
              </span>
              <span className="block mt-3 font-serif text-4xl sm:text-5xl font-light tabular-nums">
                {card.value ?? <span className="inline-block w-10 h-9 bg-[#EAE0D3]/70 animate-pulse align-middle" />}
              </span>
            </button>
          ))}
        </section>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div role="tablist" aria-label="Filter by status" className="flex gap-1 overflow-x-auto -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const count = f.id === "all" ? stats?.total : stats?.[f.id];
              const active = status === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setStatus(f.id);
                    setPage(1);
                  }}
                  className={`shrink-0 px-4 py-2.5 text-[11px] uppercase tracking-[0.18em] border transition-colors duration-300 ${
                    active ? "bg-[#30231F] border-[#30231F] text-[#F7F2EA]" : "bg-white border-[#EAE0D3] text-[#30231F]/80 hover:border-[#30231F]/50"
                  }`}
                >
                  {f.label}
                  {count !== undefined && <span className={`ml-2 ${active ? "text-[#EAE0D3]/80" : "text-[#A98563]"}`}>{count}</span>}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="relative block sm:w-72">
              <span className="sr-only">Search by name, email or reference</span>
              <Search className="w-4 h-4 text-[#817064] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Name, email or reference"
                maxLength={100}
                className="w-full bg-white border border-[#EAE0D3] focus:border-[#30231F] pl-10 pr-3 py-2.5 text-sm focus:outline-none transition-colors"
              />
            </label>
            <label className="relative block sm:w-60">
              <span className="sr-only">Sort</span>
              <ArrowUpDown className="w-4 h-4 text-[#817064] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as SortOption);
                  setPage(1);
                }}
                className="w-full appearance-none bg-white border border-[#EAE0D3] focus:border-[#30231F] pl-10 pr-3 py-2.5 text-sm focus:outline-none cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* List */}
        <section aria-label="Appointment requests" aria-busy={loading} className="bg-white border border-[#EAE0D3]">
          {error ? (
            <div role="alert" className="flex flex-col items-center text-center px-6 py-16">
              <TriangleAlert className="w-7 h-7 text-[#B2604F] mb-4" />
              <p className="font-serif text-2xl font-light mb-2">Appointments couldn&apos;t be loaded</p>
              <p className="text-sm text-[#817064] mb-6 max-w-md">{error}</p>
              <button type="button" onClick={refresh} className="btn-tactile px-6 py-3 bg-[#30231F] text-[#F7F2EA] text-[11px] uppercase tracking-[0.2em]">
                Try again
              </button>
            </div>
          ) : loading && !data ? (
            <div className="divide-y divide-[#EAE0D3]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 sm:px-6 py-5 flex items-center gap-6">
                  <div className="h-3 w-24 bg-[#EAE0D3]/70 animate-pulse" />
                  <div className="h-3 flex-1 bg-[#EAE0D3]/50 animate-pulse" />
                  <div className="h-3 w-20 bg-[#EAE0D3]/70 animate-pulse" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center text-center px-6 py-16">
              <Inbox className="w-7 h-7 text-[#A98563] mb-4" />
              <p className="font-serif text-2xl font-light mb-2">
                {query ? "No matching requests" : status === "all" ? "No appointment requests yet" : `No ${status} requests`}
              </p>
              <p className="text-sm text-[#817064]">
                {query ? "Try a different name, email or reference code." : "New requests from the website will appear here."}
              </p>
            </div>
          ) : (
            <div className={`transition-opacity duration-300 ${loading ? "opacity-60" : "opacity-100"}`}>
              {/* Desktop table */}
              <table className="hidden md:table w-full text-left">
                <thead>
                  <tr className="border-b border-[#EAE0D3] text-[10px] uppercase tracking-[0.2em] text-[#817064]">
                    <th className="font-medium px-6 py-3.5">Client</th>
                    <th className="font-medium px-4 py-3.5">Service</th>
                    <th className="font-medium px-4 py-3.5">Requested</th>
                    <th className="font-medium px-4 py-3.5 hidden lg:table-cell">Submitted</th>
                    <th className="font-medium px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE0D3]/80">
                  {items.map((a) => (
                    <tr
                      key={a.referenceCode}
                      onClick={() => setSelected(a)}
                      className="group cursor-pointer hover:bg-[#F7F2EA]/70 transition-colors duration-200 animate-fadeIn"
                    >
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(a);
                          }}
                          className="text-left"
                        >
                          <span className="block font-serif text-lg leading-snug group-hover:text-[#A98563] transition-colors">{a.fullName}</span>
                          <span className="block text-xs text-[#817064]">{a.email}</span>
                          <span className="block font-mono text-[10px] text-[#A98563] mt-0.5">{a.referenceCode}</span>
                        </button>
                      </td>
                      <td className="px-4 py-4 text-sm max-w-[200px]">{a.service}</td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap">
                        <span className="block">{formatRequestedDate(a.requestedDate)}</span>
                        <span className="block text-xs text-[#817064]">{TIME_LABELS[a.requestedTime] ?? a.requestedTime}</span>
                      </td>
                      <td className="px-4 py-4 text-xs text-[#817064] whitespace-nowrap hidden lg:table-cell">{formatSubmitted(a.createdAt)}</td>
                      <td className="px-4 py-4"><StatusBadge status={a.status} /></td>
                      <td className="px-4 py-4 text-right">
                        <ChevronRight className="w-4 h-4 text-[#817064] inline transition-transform duration-300 group-hover:translate-x-0.5" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <ul className="md:hidden divide-y divide-[#EAE0D3]">
                {items.map((a) => (
                  <li key={a.referenceCode} className="animate-fadeIn">
                    <button type="button" onClick={() => setSelected(a)} className="w-full text-left px-5 py-5 active:bg-[#F7F2EA]">
                      <span className="flex items-start justify-between gap-3 mb-2">
                        <span className="min-w-0">
                          <span className="block font-serif text-lg leading-snug truncate">{a.fullName}</span>
                          <span className="block font-mono text-[10px] text-[#A98563]">{a.referenceCode}</span>
                        </span>
                        <StatusBadge status={a.status} />
                      </span>
                      <span className="block text-sm">{a.service}</span>
                      <span className="block text-xs text-[#817064] mt-1">
                        {formatRequestedDate(a.requestedDate)} · {TIME_LABELS[a.requestedTime] ?? a.requestedTime}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data && data.total > 0 && !error && (
            <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-t border-[#EAE0D3] text-xs text-[#817064]">
              <span>
                Showing {rangeStart}–{rangeEnd} of {data.total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || loading}
                  aria-label="Previous page"
                  className="w-9 h-9 flex items-center justify-center border border-[#EAE0D3] hover:border-[#30231F]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || loading}
                  aria-label="Next page"
                  className="w-9 h-9 flex items-center justify-center border border-[#EAE0D3] hover:border-[#30231F]/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {selected && (
        <DetailDrawer
          appointment={selected}
          processing={processing}
          onClose={() => setSelected(null)}
          onApprove={() => decide(selected, "approve")}
          onReject={() => setConfirmReject(selected)}
        />
      )}

      {confirmReject && (
        <ConfirmDialog
          appointment={confirmReject}
          busy={processing?.ref === confirmReject.referenceCode}
          onCancel={() => setConfirmReject(null)}
          onConfirm={() => decide(confirmReject, "reject")}
        />
      )}

      {/* Notifications */}
      <div aria-live="polite" className="fixed z-[70] bottom-4 right-4 left-4 sm:left-auto sm:w-[400px] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto animate-panelIn flex items-start gap-3 p-4 border shadow-[0_20px_40px_-24px_rgba(48,35,31,0.55)] text-sm leading-relaxed ${
              t.tone === "error" ? "bg-[#FBF1EE] border-[#E8CBC4] text-[#7A2F23]" : "bg-white border-[#EAE0D3] text-[#30231F]"
            }`}
          >
            {t.tone === "error" ? <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" /> : <Check className="w-4 h-4 mt-0.5 shrink-0 text-[#6E8F62]" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} className="shrink-0 text-current/60 hover:text-current">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------- Shared modal behaviour: Escape, focus trap, scroll lock, focus restore ---------- */

function useModal(ref: React.RefObject<HTMLElement | null>, onClose: () => void, initialFocus?: React.RefObject<HTMLElement | null>) {
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    (initialFocus?.current ?? ref.current)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = Array.from(
        ref.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    const node = ref.current;
    node?.addEventListener("keydown", onKey);
    return () => {
      node?.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, [ref, initialFocus]);
}

function DetailRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-3.5 border-b border-[#EAE0D3]/80">
      <Icon className="w-4 h-4 text-[#A98563] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <dt className="text-[10px] uppercase tracking-[0.2em] text-[#817064] mb-0.5">{label}</dt>
        <dd className="text-sm break-words">{children}</dd>
      </div>
    </div>
  );
}

function DetailDrawer({
  appointment: a,
  processing,
  onClose,
  onApprove,
  onReject,
}: {
  appointment: AdminAppointment;
  processing: { ref: string; action: Action } | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModal(panelRef, onClose, closeRef);
  const busy = processing?.ref === a.referenceCode;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[#2B201C]/40 backdrop-blur-[2px] animate-backdropIn" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        tabIndex={-1}
        className="relative w-full sm:max-w-lg h-full bg-[#F7F2EA] shadow-2xl flex flex-col animate-drawerIn focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 px-6 sm:px-8 pt-6 pb-5 border-b border-[#EAE0D3] bg-white">
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-[#A98563] mb-1">{a.referenceCode}</p>
            <h2 id="drawer-title" className="font-serif text-2xl sm:text-3xl font-light leading-tight break-words">
              {a.fullName}
            </h2>
            <div className="mt-3">
              <StatusBadge status={a.status} />
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="shrink-0 w-10 h-10 flex items-center justify-center border border-[#EAE0D3] hover:border-[#30231F]/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-4">
          <dl>
            <DetailRow icon={Mail} label="Email">
              <a href={`mailto:${a.email}`} className="link-line pb-0.5 hover:text-[#A98563]">
                {a.email}
              </a>
            </DetailRow>
            <DetailRow icon={Phone} label="Phone">
              {a.phone ? (
                <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="link-line pb-0.5 hover:text-[#A98563]">
                  {a.phone}
                </a>
              ) : (
                <span className="text-[#817064]">Not provided</span>
              )}
            </DetailRow>
            <DetailRow icon={Scissors} label="Requested service">{a.service}</DetailRow>
            <DetailRow icon={CalendarDays} label="Requested date">{formatRequestedDate(a.requestedDate)}</DetailRow>
            <DetailRow icon={Clock} label="Time window">{TIME_LABELS[a.requestedTime] ?? a.requestedTime}</DetailRow>
            <DetailRow icon={Ruler} label="Hair length">
              {a.hairLength ? HAIR_LABELS[a.hairLength] ?? a.hairLength : <span className="text-[#817064]">Not specified</span>}
            </DetailRow>
            <DetailRow icon={MessageSquareText} label="Client notes">
              {a.notes ? <span className="whitespace-pre-line">{a.notes}</span> : <span className="text-[#817064]">None</span>}
            </DetailRow>
          </dl>

          <div className="mt-6 grid grid-cols-1 gap-2 text-xs text-[#817064]">
            <p>
              <span className="uppercase tracking-[0.18em] text-[10px]">Submitted</span> · {formatSubmitted(a.createdAt)}
            </p>
            {a.decidedAt && (
              <p>
                <span className="uppercase tracking-[0.18em] text-[10px]">{a.status === "approved" ? "Approved" : "Rejected"}</span> ·{" "}
                {formatSubmitted(a.decidedAt)}
              </p>
            )}
            <p>
              <span className="uppercase tracking-[0.18em] text-[10px]">Your notification email</span> · {emailStatusText(a.terryNotification)}
            </p>
            {a.customerNotification && (
              <p>
                <span className="uppercase tracking-[0.18em] text-[10px]">Customer email</span> ·{" "}
                {emailStatusText(a.customerNotification.status, a.customerNotification.reason)}
              </p>
            )}
          </div>
        </div>

        {a.status === "pending" && (
          <div className="border-t border-[#EAE0D3] bg-white px-6 sm:px-8 py-5">
            <p className="text-[11px] leading-relaxed text-[#817064] mb-4">
              Check your calendar before approving: this system doesn&apos;t check availability. The client is emailed either way.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onReject}
                disabled={busy}
                className="py-3.5 border border-[#B2604F]/50 text-[#8A3B2E] text-[11px] uppercase tracking-[0.2em] font-medium hover:bg-[#F4E4E0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {busy && processing?.action === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                disabled={busy}
                className="btn-tactile py-3.5 bg-[#30231F] hover:bg-[#2B201C] text-[#F7F2EA] text-[11px] uppercase tracking-[0.2em] font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {busy && processing?.action === "approve" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {busy && processing?.action === "approve" ? "Approving" : "Approve"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmDialog({
  appointment,
  busy,
  onCancel,
  onConfirm,
}: {
  appointment: AdminAppointment;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useModal(ref, busy ? () => {} : onCancel, cancelRef);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-[#2B201C]/50 animate-backdropIn" onClick={busy ? undefined : onCancel} aria-hidden="true" />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="relative w-full max-w-md bg-white border border-[#EAE0D3] shadow-2xl p-7 animate-panelIn"
      >
        <h2 id="confirm-title" className="font-serif text-2xl font-light mb-3">
          Reject this request?
        </h2>
        <p id="confirm-desc" className="text-sm text-[#30231F]/80 leading-relaxed mb-7">
          {appointment.fullName}&apos;s request for {appointment.service} on {formatRequestedDate(appointment.requestedDate)} will be marked as
          rejected and they will be emailed. This can&apos;t be undone from the dashboard.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="py-3 border border-[#EAE0D3] text-[11px] uppercase tracking-[0.2em] hover:border-[#30231F]/50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="py-3 bg-[#8A3B2E] hover:bg-[#743126] text-white text-[11px] uppercase tracking-[0.2em] transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {busy ? "Rejecting" : "Reject request"}
          </button>
        </div>
      </div>
    </div>
  );
}
