import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/admin");
  return (
    <>
      <StaffNav area="admin" />
      <div className="mx-auto mt-4 max-w-6xl flex-1 px-4 pb-8">{children}</div>
    </>
  );
}
