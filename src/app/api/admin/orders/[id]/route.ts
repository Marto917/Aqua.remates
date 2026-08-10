import { NextResponse } from "next/server";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";
import { prisma } from "@/lib/prisma";
import { getStaffContext } from "@/lib/staff-auth";
import { staffActionErrorMessage } from "@/lib/staff-action-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Solo el dueño (DEFAULT_OWNER_EMAIL) puede borrar un pedido. */
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const ctx = await getStaffContext();
    if (!canOwnerDeleteRetailOrders(ctx.session)) {
      return NextResponse.json(
        { ok: false, error: "Solo el dueño puede borrar pedidos." },
        { status: 403 },
      );
    }

    const { id: rawId } = await context.params;
    const id = rawId?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
    }

    const existing = await prisma.retailOrder.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ ok: false, error: "Pedido no encontrado." }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.retailOrderItem.deleteMany({ where: { orderId: id } }),
      prisma.retailOrder.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/orders/[id]:", e);
    return NextResponse.json(
      { ok: false, error: staffActionErrorMessage(e) },
      { status: 500 },
    );
  }
}
