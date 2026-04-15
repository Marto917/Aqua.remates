import { UserRole } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    emailVerified?: boolean;
  }
}
