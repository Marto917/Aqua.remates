import type { Session } from "next-auth";
import { UserRole } from "@prisma/client";
import { isBackofficePreview } from "@/lib/backoffice-preview";
import { getSafeSession } from "@/lib/get-session";

export type StaffContext = {
  session: Session | null;
  preview: boolean;
};

export async function getStaffContext(): Promise<StaffContext> {
  const session = await getSafeSession();
  return { session, preview: isBackofficePreview() };
}

export function canStaffAccess(ctx: StaffContext): boolean {
  const role = ctx.session?.user?.role;
  return (
    ctx.preview || role === UserRole.OWNER || role === UserRole.EMPLOYEE
  );
}

export function isOwnerAccess(ctx: StaffContext): boolean {
  const role = ctx.session?.user?.role;
  return ctx.preview || role === UserRole.OWNER;
}

export async function requireStaff(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!canStaffAccess(ctx)) {
    throw new Error("No autorizado");
  }
  return ctx;
}

export async function requireOwner(): Promise<StaffContext> {
  const ctx = await getStaffContext();
  if (!isOwnerAccess(ctx)) {
    throw new Error("Solo el dueño puede realizar esta acción");
  }
  return ctx;
}

export function staffUserId(ctx: StaffContext): string | null {
  return ctx.session?.user?.id ?? null;
}
