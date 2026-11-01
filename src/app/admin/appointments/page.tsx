import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/adminAuth";
import AppointmentsDashboard from "@/components/admin/AppointmentsDashboard";

export const metadata: Metadata = { title: "Appointments" };

export default async function AdminAppointmentsPage() {
  // Server-side gate: unauthenticated visitors are redirected before anything renders.
  // The dashboard's data comes from /api/admin/appointments, which checks the session again.
  const session = await requireAdminPage();
  return <AppointmentsDashboard adminEmail={session.email} />;
}
