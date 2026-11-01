import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin · HAIR BY REI", template: "%s · HAIR BY REI Admin" },
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // No auth check here: layouts don't re-run on navigation. Each page verifies the session itself.
  return <div className="min-h-screen bg-[#F7F2EA] text-[#30231F]">{children}</div>;
}
