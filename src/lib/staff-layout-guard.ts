import { redirect } from "next/navigation";
import { canStaffAccess, getStaffContext } from "@/lib/staff-auth";
import { getStaffLoginPath } from "@/lib/staff-login-path";

/** Segunda barrera en layouts staff (además del middleware). */
export async function requireStaffLayout(callbackPath?: string) {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    const login = getStaffLoginPath();
    const url = callbackPath ? `${login}?callbackUrl=${encodeURIComponent(callbackPath)}` : login;
    redirect(url);
  }
}
