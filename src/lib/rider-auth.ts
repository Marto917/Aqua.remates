import { SignJWT, jwtVerify } from "jose";

export type RiderTokenPayload = {
  sub: string;
  email: string;
  name: string;
  typ: "rider";
};

function getRiderJwtSecret(): Uint8Array {
  const secret = process.env.RIDER_JWT_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("RIDER_JWT_SECRET o NEXTAUTH_SECRET no configurado.");
  }
  return new TextEncoder().encode(secret);
}

export async function signRiderToken(payload: Omit<RiderTokenPayload, "typ">): Promise<string> {
  return new SignJWT({ email: payload.email, name: payload.name, typ: "rider" as const })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getRiderJwtSecret());
}

export async function verifyRiderToken(token: string): Promise<RiderTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRiderJwtSecret());
    if (payload.typ !== "rider" || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      typ: "rider",
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token || null;
}
