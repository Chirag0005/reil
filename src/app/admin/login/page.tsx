import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import AdminLoginForm from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin/appointments");
  return <AdminLoginForm />;
}
