import { StaffNav } from "@/components/staff/StaffNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffNav area="admin" />
      <div className="mt-4">{children}</div>
    </>
  );
}
