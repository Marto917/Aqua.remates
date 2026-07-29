import { StaffAccessLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { ensureDefaultStaffUsers } from "@/lib/bootstrap-staff-users";
import {
  getGoogleClientId,
  isGoogleAuthConfigured,
  resolveGoogleSignInUser,
} from "@/lib/google-auth";
import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  recordLoginFailure,
} from "@/lib/login-rate-limit";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/app-url";
import { assertNextAuthSecretConfigured } from "@/lib/nextauth-secret";
import { verifyTurnstileToken } from "@/lib/turnstile";

/** Normaliza NEXTAUTH_URL (sin barra final, www canónico en producción). */
function ensureNextAuthUrl(): void {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (raw) {
    process.env.NEXTAUTH_URL = getPublicAppUrl();
  }
}

ensureNextAuthUrl();
assertNextAuthSecretConfigured();

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  loginMode: z.enum(["customer", "staff"]).default("customer"),
  turnstileToken: z.string().optional(),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function googleProfilePicture(
  profile: unknown,
): string | null {
  if (!profile || typeof profile !== "object") return null;
  const picture = (profile as { picture?: unknown }).picture;
  return typeof picture === "string" && picture.trim() ? picture.trim() : null;
}

const googleClientId = getGoogleClientId();
const isProd = process.env.NODE_ENV === "production";
/** Comparte la cookie de sesión entre apex y www (evita “login fantasma”). */
const cookieDomain =
  process.env.NEXTAUTH_COOKIE_DOMAIN?.trim() ||
  (isProd && getPublicAppUrl().includes("aquaremates.com.ar")
    ? ".aquaremates.com.ar"
    : undefined);

/** Clientes: 30 días. Staff (OWNER/EMPLOYEE): 12 horas. */
const CUSTOMER_SESSION_MAX_AGE_SEC = 30 * 24 * 60 * 60;
const STAFF_SESSION_MAX_AGE_SEC = 12 * 60 * 60;

function isStaffRole(role: unknown): boolean {
  return role === UserRole.OWNER || role === UserRole.EMPLOYEE;
}

function sessionMaxAgeForRole(role: unknown): number {
  return isStaffRole(role) ? STAFF_SESSION_MAX_AGE_SEC : CUSTOMER_SESSION_MAX_AGE_SEC;
}

/** Corta la sesión si pasó el TTL (12h staff / 30d cliente). */
function enforceSessionTtl(token: JWT): JWT {
  const role = token.role;
  const maxAge =
    typeof token.sessionMaxAge === "number"
      ? token.sessionMaxAge
      : sessionMaxAgeForRole(role);
  const startedAt =
    typeof token.sessionStartedAt === "number"
      ? token.sessionStartedAt
      : typeof token.iat === "number"
        ? token.iat
        : null;

  if (startedAt != null && Math.floor(Date.now() / 1000) - startedAt > maxAge) {
    // Expira el JWT para que middleware / getSession lo traten como sin sesión.
    token.exp = Math.floor(Date.now() / 1000) - 60;
    delete (token as { id?: string }).id;
    return token;
  }

  // Asegura que el JWT no viva más que el TTL del rol (sobre todo staff 12h).
  if (startedAt != null) {
    token.exp = startedAt + maxAge;
  }
  if (token.sessionMaxAge == null) token.sessionMaxAge = maxAge;
  if (token.sessionStartedAt == null && startedAt != null) {
    token.sessionStartedAt = startedAt;
  }

  return token;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    // Tope de cookie = el más largo (clientes). Staff se corta en el callback jwt.
    maxAge: CUSTOMER_SESSION_MAX_AGE_SEC,
  },
  jwt: {
    maxAge: CUSTOMER_SESSION_MAX_AGE_SEC,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  ...(cookieDomain
    ? {
        cookies: {
          sessionToken: {
            name: `${isProd ? "__Secure-" : ""}next-auth.session-token`,
            options: {
              httpOnly: true,
              sameSite: "lax" as const,
              path: "/",
              secure: isProd,
              domain: cookieDomain,
              maxAge: CUSTOMER_SESSION_MAX_AGE_SEC,
            },
          },
        },
      }
    : {}),
  providers: [
    ...(isGoogleAuthConfigured() && googleClientId
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        loginMode: { label: "Modo", type: "text" },
        turnstileToken: { label: "Turnstile", type: "text" },
      },
      async authorize(credentials) {
        await ensureDefaultStaffUsers();
        const raw = {
          email: typeof credentials?.email === "string" ? credentials.email : "",
          password: typeof credentials?.password === "string" ? credentials.password : "",
          loginMode:
            credentials?.loginMode === "staff" || credentials?.loginMode === "customer"
              ? credentials.loginMode
              : "customer",
          turnstileToken:
            typeof credentials?.turnstileToken === "string" ? credentials.turnstileToken : undefined,
        };
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const email = normalizeEmail(parsed.data.email);
        const password = parsed.data.password.trimEnd();
        const loginMode = parsed.data.loginMode;

        const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken);
        if (!turnstile.ok) {
          return null;
        }

        const loginLimit = await checkLoginRateLimit(email);
        if (!loginLimit.allowed) {
          return null;
        }

        let user;
        try {
          user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });
        } catch (e) {
          console.error("[auth] Error al consultar usuario (¿DATABASE_URL o red?):", e);
          return null;
        }

        if (!user) {
          await recordLoginFailure(email);
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          await recordLoginFailure(email);
          return null;
        }

        const isStaff = user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE;
        if (loginMode === "customer" && isStaff) {
          return null;
        }
        if (loginMode === "staff" && !isStaff) {
          await recordLoginFailure(email);
          return null;
        }

        await clearLoginRateLimit(email);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });

        const emailVerified = Boolean(user.emailVerified);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          staffAccessLevel:
            user.staffAccessLevel ?? (user.role === UserRole.OWNER ? StaffAccessLevel.MANAGER : null),
          emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }
      const email = user.email;
      if (!email) {
        return "/login?error=AccessDenied";
      }
      try {
        const resolved = await resolveGoogleSignInUser({
          email,
          name: user.name,
          image: user.image,
        });
        if (!resolved.ok) {
          if (resolved.reason === "staff_account") {
            return "/login?error=StaffGoogle";
          }
          return "/login?error=AccessDenied";
        }
        return true;
      } catch (e) {
        console.error("[auth] Google signIn resolve error:", e);
        return "/login?error=AccessDenied";
      }
    },
    async jwt({ token, user, account, profile }) {
      // Google: persistir el usuario de nuestra DB en el JWT (no confiar solo en mutar `user` en signIn).
      if (account?.provider === "google") {
        const email =
          (typeof user?.email === "string" && user.email) ||
          (typeof profile?.email === "string" && profile.email) ||
          (typeof token.email === "string" && token.email) ||
          null;
        if (!email) {
          return token;
        }
        try {
          const resolved = await resolveGoogleSignInUser({
            email,
            name: user?.name ?? (typeof profile?.name === "string" ? profile.name : null),
            image: user?.image ?? googleProfilePicture(profile),
          });
          if (resolved.ok) {
            token.id = resolved.id;
            token.role = resolved.role;
            token.staffAccessLevel = null;
            token.emailVerified = true;
            token.email = resolved.email;
            token.name = resolved.name;
            token.sessionMaxAge = sessionMaxAgeForRole(resolved.role);
            token.sessionStartedAt = Math.floor(Date.now() / 1000);
            if (resolved.imageUrl) {
              token.picture = resolved.imageUrl;
            }
          }
        } catch (e) {
          console.error("[auth] Google jwt resolve error:", e);
        }
        return enforceSessionTtl(token);
      }

      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.staffAccessLevel = user.staffAccessLevel ?? null;
        token.emailVerified = Boolean(user.emailVerified);
        token.sessionMaxAge = sessionMaxAgeForRole(user.role);
        token.sessionStartedAt = Math.floor(Date.now() / 1000);
        if (user.image) {
          token.picture = user.image;
        }
      }

      // Si el JWT quedó sin id/rol (sesión vieja o OAuth incompleto), rehidratar desde DB.
      if ((!token.id || !token.role) && (token.email || token.sub)) {
        try {
          const email =
            typeof token.email === "string" ? token.email.trim().toLowerCase() : null;
          const dbUser = token.id
            ? await prisma.user.findUnique({
                where: { id: String(token.id) },
                select: {
                  id: true,
                  role: true,
                  staffAccessLevel: true,
                  emailVerified: true,
                  name: true,
                  email: true,
                  imageUrl: true,
                },
              })
            : email
              ? await prisma.user.findFirst({
                  where: { email: { equals: email, mode: "insensitive" } },
                  select: {
                    id: true,
                    role: true,
                    staffAccessLevel: true,
                    emailVerified: true,
                    name: true,
                    email: true,
                    imageUrl: true,
                  },
                })
              : null;
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.staffAccessLevel =
              dbUser.staffAccessLevel ??
              (dbUser.role === UserRole.OWNER ? StaffAccessLevel.MANAGER : null);
            token.emailVerified = Boolean(dbUser.emailVerified);
            token.name = dbUser.name;
            token.email = dbUser.email;
            if (dbUser.imageUrl) token.picture = dbUser.imageUrl;
            if (token.sessionMaxAge == null) {
              token.sessionMaxAge = sessionMaxAgeForRole(dbUser.role);
            }
            if (token.sessionStartedAt == null) {
              token.sessionStartedAt =
                typeof token.iat === "number" ? token.iat : Math.floor(Date.now() / 1000);
            }
          }
        } catch (e) {
          console.error("[auth] jwt rehydrate error:", e);
        }
      }

      return enforceSessionTtl(token);
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? UserRole.CUSTOMER;
        session.user.staffAccessLevel = token.staffAccessLevel ?? null;
        session.user.emailVerified = Boolean(token.emailVerified);
        if (typeof token.email === "string") session.user.email = token.email;
        if (typeof token.name === "string") session.user.name = token.name;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { imageUrl: true, name: true, role: true },
          });
          if (dbUser?.name) {
            session.user.name = dbUser.name;
          }
          if (dbUser?.role) {
            session.user.role = dbUser.role;
          }
          const fromToken = typeof token.picture === "string" ? token.picture : null;
          session.user.image = dbUser?.imageUrl?.trim() || fromToken || null;
          void prisma.user
            .update({
              where: { id: token.id as string },
              data: { lastActiveAt: new Date() },
            })
            .catch(() => undefined);
        } catch (e) {
          console.error("[auth] session lookup error:", e);
          const fromToken = typeof token.picture === "string" ? token.picture : null;
          session.user.image = fromToken;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        /* ignore */
      }
      return baseUrl;
    },
  },
};
