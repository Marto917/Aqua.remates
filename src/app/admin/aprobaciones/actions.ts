"use server";

import { revalidatePath } from "next/cache";
import { ApprovalStatus } from "@prisma/client";
import { z } from "zod";
import { logWholesaleRequestEvent } from "@/lib/wholesale-events";
import { prisma } from "@/lib/prisma";
import { requireOwner, staffUserId } from "@/lib/staff-auth";

const resolveSchema = z.object({
  id: z.string().min(1),
  status: z.enum([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED]),
  resolutionNote: z.string().optional(),
});

export async function resolveApprovalRequest(formData: FormData) {
  let ctx;
  try {
    ctx = await requireOwner();
  } catch {
    return;
  }

  const parsed = resolveSchema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    resolutionNote: formData.get("resolutionNote"),
  });
  if (!parsed.success) {
    return;
  }

  const note = parsed.data.resolutionNote?.trim() ?? "";
  const resolverId = ctx.preview ? null : staffUserId(ctx);

  const existing = await prisma.approvalRequest.findUnique({
    where: { id: parsed.data.id },
    select: { status: true, wholesaleRequestId: true },
  });
  if (!existing || existing.status !== ApprovalStatus.PENDING) {
    return;
  }

  await prisma.approvalRequest.update({
    where: { id: parsed.data.id },
    data: {
      status: parsed.data.status,
      resolutionNote: note || null,
      resolvedById: resolverId,
    },
  });

  await logWholesaleRequestEvent(
    existing.wholesaleRequestId,
    resolverId,
    "APPROVAL_RESOLVED",
    { approvalId: parsed.data.id, status: parsed.data.status },
  );

  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/mayoristas");
  revalidatePath(`/admin/mayoristas/solicitud/${existing.wholesaleRequestId}`);
}
