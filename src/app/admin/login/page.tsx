import { redirect } from "next/navigation";

/** El login unificado está en `/login` (NextAuth). */
export default function AdminLoginRedirectPage() {
  redirect("/login?callbackUrl=/admin");
}
