import { prisma } from "@/lib/prisma";
import {
  MAX_CUSTOMER_ADDRESSES,
  type CustomerAddressDTO,
} from "@/lib/customer-address-types";

export { MAX_CUSTOMER_ADDRESSES, type CustomerAddressDTO };

export type CustomerAddressInput = {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes?: string | null;
  label?: string | null;
  isDefault?: boolean;
};

function normalizeAddressInput(input: CustomerAddressInput) {
  return {
    address: input.address.trim(),
    city: input.city.trim(),
    province: input.province.trim(),
    postalCode: input.postalCode.trim(),
    notes: input.notes?.trim() || null,
    label: input.label?.trim() || null,
  };
}

export async function listCustomerAddresses(userId: string): Promise<CustomerAddressDTO[]> {
  const rows = await prisma.customerAddress.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    address: r.address,
    city: r.city,
    province: r.province,
    postalCode: r.postalCode,
    notes: r.notes,
    isDefault: r.isDefault,
  }));
}

async function syncLegacyDefaultFields(userId: string) {
  const def = await prisma.customerAddress.findFirst({
    where: { userId, isDefault: true },
    orderBy: { updatedAt: "desc" },
  });
  const fallback =
    def ??
    (await prisma.customerAddress.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }));

  await prisma.user.update({
    where: { id: userId },
    data: {
      defaultShippingAddress: fallback?.address ?? null,
      defaultShippingCity: fallback?.city ?? null,
      defaultShippingProvince: fallback?.province ?? null,
      defaultShippingPostalCode: fallback?.postalCode ?? null,
      defaultShippingNotes: fallback?.notes ?? null,
    },
  });
}

export async function countCustomerAddresses(userId: string): Promise<number> {
  return prisma.customerAddress.count({ where: { userId } });
}

/**
 * Guarda una dirección si hay cupo (< 5).
 * Si ya hay 5, no guarda y devuelve saved:false (el pedido puede usar la dirección igual).
 */
export async function trySaveCustomerAddress(
  userId: string,
  input: CustomerAddressInput,
): Promise<{ saved: boolean; address?: CustomerAddressDTO; reason?: "limit" | "invalid" }> {
  const data = normalizeAddressInput(input);
  if (!data.address || !data.city || !data.province || !data.postalCode) {
    return { saved: false, reason: "invalid" };
  }

  const count = await countCustomerAddresses(userId);
  if (count >= MAX_CUSTOMER_ADDRESSES) {
    return { saved: false, reason: "limit" };
  }

  const makeDefault = Boolean(input.isDefault) || count === 0;

  if (makeDefault) {
    await prisma.customerAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const created = await prisma.customerAddress.create({
    data: {
      userId,
      ...data,
      isDefault: makeDefault,
    },
  });

  await syncLegacyDefaultFields(userId);

  return {
    saved: true,
    address: {
      id: created.id,
      label: created.label,
      address: created.address,
      city: created.city,
      province: created.province,
      postalCode: created.postalCode,
      notes: created.notes,
      isDefault: created.isDefault,
    },
  };
}

export async function updateCustomerAddress(
  userId: string,
  addressId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddressDTO | null> {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return null;

  const data = normalizeAddressInput(input);
  if (!data.address || !data.city || !data.province || !data.postalCode) {
    return null;
  }

  if (input.isDefault) {
    await prisma.customerAddress.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.customerAddress.update({
    where: { id: addressId },
    data: {
      ...data,
      isDefault: input.isDefault ? true : existing.isDefault,
    },
  });

  await syncLegacyDefaultFields(userId);

  return {
    id: updated.id,
    label: updated.label,
    address: updated.address,
    city: updated.city,
    province: updated.province,
    postalCode: updated.postalCode,
    notes: updated.notes,
    isDefault: updated.isDefault,
  };
}

export async function deleteCustomerAddress(userId: string, addressId: string): Promise<boolean> {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return false;

  await prisma.customerAddress.delete({ where: { id: addressId } });

  if (existing.isDefault) {
    const next = await prisma.customerAddress.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.customerAddress.update({
        where: { id: next.id },
        data: { isDefault: true },
      });
    }
  }

  await syncLegacyDefaultFields(userId);
  return true;
}

export async function setDefaultCustomerAddress(userId: string, addressId: string): Promise<boolean> {
  const existing = await prisma.customerAddress.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) return false;

  await prisma.customerAddress.updateMany({
    where: { userId, isDefault: true },
    data: { isDefault: false },
  });
  await prisma.customerAddress.update({
    where: { id: addressId },
    data: { isDefault: true },
  });
  await syncLegacyDefaultFields(userId);
  return true;
}
