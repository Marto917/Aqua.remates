import { redirect } from "next/navigation";
import { getStaffLoginPath } from "@/lib/staff-login-path";

/** Redirige al login staff oculto (sin link público). */
export default function AdminLoginRedirectPage() {
  redirect(getStaffLoginPath());
}
