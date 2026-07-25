import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/admin");
  return (
    <div className="min-h-screen bg-slate-50 lg:pl-60">
      <StaffNav area="admin" />
      <div className="mx-auto max-w-6xl flex-1 px-4 pb-8 pt-4">{children}</div>
    </div>
  );
}
