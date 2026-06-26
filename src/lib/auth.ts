import { StaffAccessLevel, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod";
import { ensureDefaultStaffUsers } from "@/lib/bootstrap-staff-users";
import {
  getGoogleClientId,
  isGoogleAuthConfigured,
  resolveGoogleSignInUser,
} from "@/lib/google-auth";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/app-url";

/** Normaliza NEXTAUTH_URL (sin barra final, www canónico en producción). */
function ensureNextAuthUrl(): void {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (raw) {
    process.env.NEXTAUTH_URL = getPublicAppUrl();
  }
}

ensureNextAuthUrl();

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  loginMode: z.enum(["customer", "staff"]).default("customer"),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

const googleClientId = getGoogleClientId();

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(isGoogleAuthConfigured() && googleClientId
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        loginMode: { label: "Modo", type: "text" },
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
        };
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const email = normalizeEmail(parsed.data.email);
        const password = parsed.data.password.trimEnd();
        const loginMode = parsed.data.loginMode;

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
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
          return null;
        }

        const isStaff = user.role === UserRole.OWNER || user.role === UserRole.EMPLOYEE;
        if (loginMode === "customer" && isStaff) {
          return null;
        }
        if (loginMode === "staff" && !isStaff) {
          return null;
        }

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
        return false;
      }
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
      const u = user as NextAuthUser & {
        id?: string;
        role?: UserRole;
        emailVerified?: boolean;
        staffAccessLevel?: null;
      };
      u.id = resolved.id;
      u.name = resolved.name;
      u.email = resolved.email;
      u.role = resolved.role;
      u.emailVerified = resolved.emailVerified;
      u.staffAccessLevel = null;
      (u as NextAuthUser & { image?: string }).image = resolved.imageUrl ?? undefined;
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.staffAccessLevel = user.staffAccessLevel ?? null;
        token.emailVerified = Boolean(user.emailVerified);
        if (account?.provider === "google" && user.image) {
          token.picture = user.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.staffAccessLevel = token.staffAccessLevel ?? null;
        session.user.emailVerified = Boolean(token.emailVerified);
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { imageUrl: true, name: true },
        });
        if (dbUser?.name) {
          session.user.name = dbUser.name;
        }
        const fromToken = typeof token.picture === "string" ? token.picture : null;
        session.user.image = dbUser?.imageUrl?.trim() || fromToken || null;
        void prisma.user
          .update({
            where: { id: token.id as string },
            data: { lastActiveAt: new Date() },
          })
          .catch(() => undefined);
      }
      return session;
    },
  },
};
