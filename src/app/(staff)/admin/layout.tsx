import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/admin");
  return <StaffNav area="admin">{children}</StaffNav>;
}
