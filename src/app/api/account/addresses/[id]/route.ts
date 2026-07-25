import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import {
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/lib/customer-addresses";
import { getSafeSession } from "@/lib/get-session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

async function requireCustomer() {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return null;
  }
  return session.user.id;
}

export async function PATCH(req: Request, context: RouteContext) {
  const userId = await requireCustomer();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const body = (await req.json()) as {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    notes?: string;
    label?: string;
    isDefault?: boolean;
    setDefaultOnly?: boolean;
  };

  if (body.setDefaultOnly) {
    const ok = await setDefaultCustomerAddress(userId, id);
    if (!ok) return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });
    return NextResponse.json({ ok: true });
  }

  const updated = await updateCustomerAddress(userId, id, {
    address: body.address ?? "",
    city: body.city ?? "",
    province: body.province ?? "",
    postalCode: body.postalCode ?? "",
    notes: body.notes,
    label: body.label,
    isDefault: body.isDefault,
  });

  if (!updated) {
    return NextResponse.json({ error: "No se pudo actualizar." }, { status: 400 });
  }
  return NextResponse.json({ ok: true, address: updated });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const userId = await requireCustomer();
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const ok = await deleteCustomerAddress(userId, id);
  if (!ok) return NextResponse.json({ error: "Dirección no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
