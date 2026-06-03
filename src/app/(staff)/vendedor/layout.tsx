import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/vendedor");
  return (
    <>
      <StaffNav area="vendedor" />
      <div className="mx-auto max-w-6xl flex-1 px-4 pb-8 pt-4">{children}</div>
    </>
  );
}
