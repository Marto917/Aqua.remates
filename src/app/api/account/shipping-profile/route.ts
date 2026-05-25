import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSafeSession();
  if (!session?.user?.id || session.user.role !== UserRole.CUSTOMER) {
    return NextResponse.json({ profile: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      defaultShippingAddress: true,
      defaultShippingCity: true,
      defaultShippingProvince: true,
      defaultShippingPostalCode: true,
      defaultShippingNotes: true,
    },
  });

  if (!user) {
    return NextResponse.json({ profile: null });
  }

  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      shippingAddress: user.defaultShippingAddress,
      shippingCity: user.defaultShippingCity,
      shippingProvince: user.defaultShippingProvince,
      shippingPostalCode: user.defaultShippingPostalCode,
      shippingNotes: user.defaultShippingNotes,
    },
  });
}
