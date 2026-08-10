import { NextResponse } from "next/server";
import { canOwnerDeleteRetailOrders } from "@/lib/customer-order-delete";
import { permanentlyDeleteRetailOrder } from "@/lib/retail-order-trash";
import { getStaffContext } from "@/lib/staff-auth";
import { staffActionErrorMessage } from "@/lib/staff-action-error";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

/** Borrado definitivo desde la papelera. Solo el dueño. */
export async function DELETE(_req: Request, context: RouteContext) {
  try {
    const ctx = await getStaffContext();
    if (!canOwnerDeleteRetailOrders(ctx.session)) {
      return NextResponse.json(
        { ok: false, error: "Solo el dueño puede borrar definitivamente." },
        { status: 403 },
      );
    }

    const { id: rawId } = await context.params;
    const id = rawId?.trim() ?? "";
    if (!id) {
      return NextResponse.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
    }

    const result = await permanentlyDeleteRetailOrder(id);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/orders/[id]/purge:", e);
    return NextResponse.json(
      { ok: false, error: staffActionErrorMessage(e) },
      { status: 500 },
    );
  }
}
