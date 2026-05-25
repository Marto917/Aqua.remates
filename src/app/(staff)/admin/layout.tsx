import { StaffNav } from "@/components/staff/StaffNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffNav area="admin" />
      <div className="mx-auto mt-4 max-w-6xl flex-1 px-4 pb-8">{children}</div>
    </>
  );
}
