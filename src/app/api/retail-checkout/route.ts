import { NextResponse } from "next/server";
import { BillingMode } from "@prisma/client";
import { z } from "zod";
import { getClientIp, hashIp } from "@/lib/client-ip";
import {
  buyerEmailMatchesSession,
  checkPendingOrdersLimit,
  requireVerifiedCustomerSession,
  validateCheckoutQuantities,
} from "@/lib/checkout-security";
import { createCheckoutPreference, isMercadoPagoConfigured } from "@/lib/mercadopago";
import { getFreeShippingSettings } from "@/lib/free-shipping";
import { getSafeSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";
import { initialDeliveryStatus } from "@/lib/delivery-dispatch";
import { shippingAddressHasStreetNumber, SHIPPING_ADDRESS_HINT } from "@/lib/address-validation";
import { checkRateLimit, RATE_LIMITS, recordRateLimitAttempt } from "@/lib/rate-limit";
import { resolveRetailCartLines } from "@/lib/retail-cart";
import { resolveShippingQuote } from "@/lib/shipping-quote";
import { sendPendingTransferEmail } from "@/lib/order-transaction-emails";
import { trySaveCustomerAddress } from "@/lib/customer-addresses";
import { getStoreSettings } from "@/lib/store-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";

const lineSchema = z.object({
  variantId: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

const checkoutSchema = z
  .object({
    buyerName: z.string().min(2),
    buyerEmail: z.string().email(),
    buyerPhone: z.string().trim().min(8, "Indicá un teléfono o WhatsApp válido."),
    notes: z.string().optional(),
    paymentMethod: z.enum(["BANK_TRANSFER", "MERCADO_PAGO"]),
    shippingMethod: z.enum(["PICKUP", "DELIVERY", "SHIPPING_TO_COORDINATE"]),
    shippingAddress: z.string().optional(),
    shippingCity: z.string().optional(),
    shippingProvince: z.string().optional(),
    shippingPostalCode: z.string().optional(),
    shippingNotes: z.string().optional(),
    saveToProfile: z.boolean().optional(),
    turnstileToken: z.string().optional(),
    lines: z.array(lineSchema).min(1),
  })
  .superRefine((data, ctx) => {
    if (data.shippingMethod === "DELIVERY") {
      if (!data.shippingAddress?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá la dirección de envío.", path: ["shippingAddress"] });
      }
      if (!data.shippingCity?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá la ciudad.", path: ["shippingCity"] });
      }
      if (!data.shippingProvince?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá la provincia.", path: ["shippingProvince"] });
      }
      if (!data.shippingPostalCode?.trim()) {
        ctx.addIssue({ code: "custom", message: "Indicá el código postal.", path: ["shippingPostalCode"] });
      }
      if (data.shippingAddress?.trim() && !shippingAddressHasStreetNumber(data.shippingAddress)) {
        ctx.addIssue({
          code: "custom",
          message: SHIPPING_ADDRESS_HINT,
          path: ["shippingAddress"],
        });
      }
    }
    if (data.paymentMethod === "MERCADO_PAGO" && !isMercadoPagoConfigured()) {
      ctx.addIssue({
        code: "custom",
        message: "Mercado Pago no está configurado en el servidor.",
        path: ["paymentMethod"],
      });
    }
  });

export async function POST(req: Request) {
  const session = await getSafeSession();
  const auth = requireVerifiedCustomerSession(session);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const clientIp = getClientIp(req);
  const ipCheck = await checkRateLimit(RATE_LIMITS.checkoutIp(hashIp(clientIp)));
  if (!ipCheck.allowed) {
    return NextResponse.json({ error: ipCheck.message }, { status: 429 });
  }
  const userCheck = await checkRateLimit(RATE_LIMITS.checkoutUser(auth.userId));
  if (!userCheck.allowed) {
    return NextResponse.json({ error: userCheck.message }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;

  const turnstile = await verifyTurnstileToken(data.turnstileToken, clientIp);
  if (!turnstile.ok) {
    return NextResponse.json({ error: turnstile.error }, { status: 400 });
  }

  if (!buyerEmailMatchesSession(data.buyerEmail, auth.email)) {
    return NextResponse.json(
      { error: "El email del pedido debe coincidir con el de tu cuenta." },
      { status: 400 },
    );
  }

  const qtyCheck = validateCheckoutQuantities(data.lines);
  if (!qtyCheck.ok) {
    return NextResponse.json({ error: qtyCheck.error }, { status: 400 });
  }

  const pendingCheck = await checkPendingOrdersLimit(auth.userId);
  if (!pendingCheck.allowed) {
    return NextResponse.json({ error: pendingCheck.message }, { status: 429 });
  }

  const resolved = await resolveRetailCartLines(data.lines, data.paymentMethod);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  const customerId = auth.userId;

  const [settings, freeShipping] = await Promise.all([getStoreSettings(), getFreeShippingSettings()]);
  const { cart } = resolved;
  const cartCategoryIds = [...new Set(cart.lines.map((l) => l.categoryId))];

  const quote = await resolveShippingQuote({
    shippingMethod: data.shippingMethod,
    postalCode: data.shippingPostalCode,
    province: data.shippingProvince,
    subtotalAmount: cart.subtotalAmount,
    cartCategoryIds,
    freeShipping,
  });

  if (quote.error) {
    return NextResponse.json({ error: quote.error }, { status: 400 });
  }

  const isTransfer = data.paymentMethod === "BANK_TRANSFER";
  const status = isTransfer ? "PENDING_TRANSFER" : "PENDING_PAYMENT";
  const billingMode: BillingMode = isTransfer ? "NEGRO" : "BLANCO";

  const order = await prisma.retailOrder.create({
    data: {
      customerId,
      buyerName: data.buyerName.trim(),
      buyerEmail: data.buyerEmail.trim().toLowerCase(),
      buyerPhone: data.buyerPhone.trim(),
      notes: data.notes?.trim() || null,
      billingMode,
      paymentMethod: data.paymentMethod,
      shippingMethod: data.shippingMethod,
      shippingAddress: data.shippingAddress?.trim() || null,
      shippingCity: data.shippingCity?.trim() || null,
      shippingProvince: data.shippingProvince?.trim() || null,
      shippingPostalCode: data.shippingPostalCode?.trim() || null,
      shippingNotes: data.shippingNotes?.trim() || null,
      deliveryStatus: initialDeliveryStatus(data.shippingMethod),
      subtotalAmount: cart.subtotalAmount,
      shippingAmount: quote.shippingAmount,
      shippingZone: quote.zone,
      totalAmount: quote.totalAmount,
      status,
      transferAlias: isTransfer ? settings.bankAlias : null,
      transferCbu: isTransfer ? settings.bankCbu : null,
      items: {
        create: cart.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          productName: line.productName,
          variantColorLabel: line.variantColorLabel,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          subtotal: line.subtotal,
        })),
      },
    },
    include: { items: true },
  });

  if (customerId && data.saveToProfile && data.shippingMethod === "DELIVERY") {
    await prisma.user.update({
      where: { id: customerId },
      data: { phone: data.buyerPhone.trim() },
    });
    // Si ya hay 5 direcciones, el pedido usa esta igual pero no se guarda.
    await trySaveCustomerAddress(customerId, {
      address: data.shippingAddress?.trim() || "",
      city: data.shippingCity?.trim() || "",
      province: data.shippingProvince?.trim() || "",
      postalCode: data.shippingPostalCode?.trim() || "",
      notes: data.shippingNotes?.trim() || null,
      isDefault: false,
    });
  } else if (customerId) {
    await prisma.user.update({
      where: { id: customerId },
      data: { phone: data.buyerPhone.trim() },
    });
  }

  if (isTransfer) {
    const transfer = {
      holder: settings.bankHolder,
      alias: settings.bankAlias,
      cbu: settings.bankCbu,
      notes: settings.bankExtraNotes,
    };
    try {
      await sendPendingTransferEmail(order, transfer);
    } catch (e) {
      console.error("Email pendiente de transferencia:", e);
    }
    await recordRateLimitAttempt(RATE_LIMITS.checkoutUser(customerId));
    await recordRateLimitAttempt(RATE_LIMITS.checkoutIp(hashIp(clientIp)));
    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "BANK_TRANSFER",
      transfer,
      subtotalAmount: cart.subtotalAmount,
      shippingAmount: quote.shippingAmount,
      totalAmount: quote.totalAmount,
    });
  }

  try {
    const { preferenceId, initPoint } = await createCheckoutPreference({
      orderId: order.id,
      buyerEmail: order.buyerEmail,
      buyerName: order.buyerName,
      lines: cart.lines,
      shippingAmount: quote.shippingAmount,
      totalAmount: quote.totalAmount,
    });

    await prisma.retailOrder.update({
      where: { id: order.id },
      data: { mercadoPagoPreferenceId: preferenceId },
    });

    await recordRateLimitAttempt(RATE_LIMITS.checkoutUser(customerId));
    await recordRateLimitAttempt(RATE_LIMITS.checkoutIp(hashIp(clientIp)));

    return NextResponse.json({
      orderId: order.id,
      paymentMethod: "MERCADO_PAGO",
      initPoint,
      subtotalAmount: cart.subtotalAmount,
      shippingAmount: quote.shippingAmount,
      totalAmount: quote.totalAmount,
    });
  } catch (e) {
    console.error("Mercado Pago preference error:", e);
    return NextResponse.json(
      {
        error: "No se pudo iniciar el pago con Mercado Pago. Intentá de nuevo o elegí transferencia.",
        orderId: order.id,
      },
      { status: 502 },
    );
  }
}
