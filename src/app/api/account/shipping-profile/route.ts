import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import {
  listCustomerAddresses,
  MAX_CUSTOMER_ADDRESSES,
  trySaveCustomerAddress,
} from "@/lib/customer-addresses";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ profile: null, addresses: [] });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });

  if (!user) {
    return NextResponse.json({ profile: null, addresses: [] });
  }

  const addresses = await listCustomerAddresses(session.user.id);
  const def = addresses.find((a) => a.isDefault) ?? addresses[0] ?? null;

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      // Compat con checkout viejo: primera/default
      shippingAddress: def?.address ?? null,
      shippingCity: def?.city ?? null,
      shippingProvince: def?.province ?? null,
      shippingPostalCode: def?.postalCode ?? null,
      shippingNotes: def?.notes ?? null,
    },
    addresses,
    maxAddresses: MAX_CUSTOMER_ADDRESSES,
    addressSlotsLeft: Math.max(0, MAX_CUSTOMER_ADDRESSES - addresses.length),
  });
}

export async function POST(req: Request) {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = (await req.json()) as {
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    notes?: string;
    label?: string;
    isDefault?: boolean;
  };

  const result = await trySaveCustomerAddress(session.user.id, {
    address: body.address ?? "",
    city: body.city ?? "",
    province: body.province ?? "",
    postalCode: body.postalCode ?? "",
    notes: body.notes,
    label: body.label,
    isDefault: body.isDefault,
  });

  if (!result.saved) {
    if (result.reason === "limit") {
      return NextResponse.json(
        {
          error: `Ya tenés ${MAX_CUSTOMER_ADDRESSES} direcciones guardadas. Podés usar otra en el pedido, pero no se guardará.`,
          reason: "limit",
          maxAddresses: MAX_CUSTOMER_ADDRESSES,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Completá calle, ciudad, provincia y CP." }, { status: 400 });
  }

  return NextResponse.json({ ok: true, address: result.address });
}
