import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .email(),
  password: z.string().min(6),
  branchKey: z.string().optional().transform((v) => (v ?? "").trim()),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email y contraseña",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        branchKey: { label: "Clave de sucursal", type: "password" },
      },
      async authorize(credentials) {
        const raw = {
          email: typeof credentials?.email === "string" ? credentials.email : "",
          password: typeof credentials?.password === "string" ? credentials.password : "",
          branchKey:
            typeof credentials?.branchKey === "string" ? credentials.branchKey : "",
        };
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          return null;
        }

        const email = normalizeEmail(parsed.data.email);
        const password = parsed.data.password.trimEnd();
        const branchKey = parsed.data.branchKey;

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
        if (isStaff) {
          const expected = (process.env.STAFF_BRANCH_KEY ?? "").trim();
          if (!expected) {
            console.error(
              "[auth] STAFF_BRANCH_KEY no configurada; login de staff bloqueado por seguridad.",
            );
            return null;
          }
          if (branchKey !== expected) {
            return null;
          }
        }

        const emailVerified = Boolean(user.emailVerified);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
        token.emailVerified = Boolean(user.emailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.emailVerified = Boolean(token.emailVerified);
      }
      return session;
    },
  },
};
