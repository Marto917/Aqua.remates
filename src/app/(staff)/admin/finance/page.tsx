import { redirect } from "next/navigation";

/** Alias legacy → panel unificado */
export default function AdminFinanceRedirectPage() {
  redirect("/admin/finanzas");
}
