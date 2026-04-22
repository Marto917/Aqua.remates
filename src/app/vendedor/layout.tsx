import { StaffNav } from "@/components/staff/StaffNav";

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StaffNav area="vendedor" />
      <div className="mt-4">{children}</div>
    </>
  );
}
