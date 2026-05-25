import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

/** Contenedor staff: sin nav de clientes (carrito, catálogo, modo mayorista). */
export default function StaffShellLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}
