import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaffLayout } from "@/lib/staff-layout-guard";

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  await requireStaffLayout("/vendedor");
  return (
    <div className="min-h-screen bg-slate-50 lg:pl-60">
      <StaffNav area="vendedor" />
      <div className="mx-auto max-w-6xl flex-1 px-4 pb-8 pt-4">{children}</div>
    </div>
  );
}
