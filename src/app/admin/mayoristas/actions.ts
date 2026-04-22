"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApprovalStatus, WholesaleLeadStatus, WholesaleRequestStatus } from "@prisma/client";
import { z } from "zod";
import { logWholesaleRequestEvent } from "@/lib/wholesale-events";
import { prisma } from "@/lib/prisma";
import { requireStaff, staffUserId } from "@/lib/staff-auth";

const approvalTypeSchema = z.enum(["PRECIO_ESPECIAL", "PLAZO_EXTRA", "CREDITO", "OTRO"]);

export async function updateWholesaleRequestStatus(formData: FormData) {
  const ctx = await requireStaff();
  const id = String(formData.get("id"));
  const status = z.nativeEnum(WholesaleRequestStatus).parse(formData.get("status"));
  const prev = await prisma.wholesaleRequest.findUnique({ where: { id } });
  if (!prev) {
    throw new Error("Solicitud no encontrada");
  }

  await prisma.wholesaleRequest.update({
    where: { id },
    data: { status },
  });

  await logWholesaleRequestEvent(id, staffUserId(ctx), "STATUS_CHANGED", {
    from: prev.status,
    to: status,
  });

  revalidatePath("/admin/mayoristas");
  revalidatePath(`/admin/mayoristas/solicitud/${id}`);
}

export async function assignWholesaleRequest(formData: FormData) {
  const ctx = await requireStaff();
  const id = String(formData.get("id"));
  const raw = String(formData.get("assignedToId") ?? "");
  const cleared = raw === "" || raw === "__none";

  await prisma.wholesaleRequest.update({
    where: { id },
    data: { assignedToId: cleared ? null : raw },
  });

  await logWholesaleRequestEvent(id, staffUserId(ctx), "ASSIGNED", {
    assignedToId: cleared ? null : raw,
  });

  revalidatePath("/admin/mayoristas");
  revalidatePath(`/admin/mayoristas/solicitud/${id}`);
}

export async function createApprovalRequestFromWholesale(formData: FormData) {
  const ctx = await requireStaff();
  const uid = staffUserId(ctx);
  const wholesaleRequestId = String(formData.get("wholesaleRequestId") ?? "");

  if (!uid) {
    redirect(`/admin/mayoristas/solicitud/${wholesaleRequestId}?approval=need_login`);
  }

  const parsed = z
    .object({
      type: approvalTypeSchema,
      note: z.string().trim().min(5),
    })
    .safeParse({
      type: formData.get("type"),
      note: formData.get("note"),
    });

  if (!parsed.success) {
    redirect(`/admin/mayoristas/solicitud/${wholesaleRequestId}?approval=invalid`);
  }

  await prisma.approvalRequest.create({
    data: {
      wholesaleRequestId,
      requestedById: uid,
      type: parsed.data.type,
      note: parsed.data.note,
      status: ApprovalStatus.PENDING,
    },
  });

  await logWholesaleRequestEvent(wholesaleRequestId, uid, "APPROVAL_REQUESTED", { type: parsed.data.type });

  revalidatePath("/admin/mayoristas");
  revalidatePath(`/admin/mayoristas/solicitud/${wholesaleRequestId}`);
  revalidatePath("/admin/aprobaciones");
  redirect(`/admin/mayoristas/solicitud/${wholesaleRequestId}?approval=ok`);
}

export async function updateWholesaleLeadStatus(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id"));
  const status = z.nativeEnum(WholesaleLeadStatus).parse(formData.get("status"));

  await prisma.wholesaleLead.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/mayoristas");
  revalidatePath(`/admin/mayoristas/lead/${id}`);
}
