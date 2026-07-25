import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/vendedor");
  return <StaffNav area="vendedor">{children}</StaffNav>;
}
