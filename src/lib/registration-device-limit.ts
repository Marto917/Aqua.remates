import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_REGISTRATIONS_PER_DEVICE = 2;
const WINDOW_MS = 1000 * 60 * 60 * 24 * 30; // 30 días

export function hashDeviceKey(deviceId: string): string {
  return createHash("sha256").update(deviceId.trim()).digest("hex");
}

export async function checkRegistrationDeviceLimit(
  deviceId: string | undefined | null,
): Promise<{ allowed: boolean; message?: string }> {
  if (!deviceId || deviceId.length < 8) {
    return {
      allowed: false,
      message: "No se pudo validar el dispositivo. Recargá la página e intentá de nuevo.",
    };
  }

  const deviceKey = hashDeviceKey(deviceId);
  const row = await prisma.registrationDevice.findUnique({ where: { deviceKey } });

  if (!row) return { allowed: true };

  const withinWindow =
    row.lastRegistrationAt && Date.now() - row.lastRegistrationAt.getTime() < WINDOW_MS;

  if (withinWindow && row.registrationCount >= MAX_REGISTRATIONS_PER_DEVICE) {
    return {
      allowed: false,
      message:
        "Ya se crearon varias cuentas desde este dispositivo. Si necesitás ayuda, contactanos por WhatsApp.",
    };
  }

  return { allowed: true };
}

export async function recordRegistrationDevice(deviceId: string | undefined | null): Promise<void> {
  if (!deviceId || deviceId.length < 8) return;

  const deviceKey = hashDeviceKey(deviceId);
  const now = new Date();

  await prisma.registrationDevice.upsert({
    where: { deviceKey },
    create: { deviceKey, registrationCount: 1, lastRegistrationAt: now },
    update: {
      registrationCount: { increment: 1 },
      lastRegistrationAt: now,
    },
  });
}
