import { StaffAccessLevel, UserRole } from "@prisma/client";
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      staffAccessLevel?: StaffAccessLevel | null;
      emailVerified: boolean;
    };
  }

  interface User {
    id: string;
    role: UserRole;
    staffAccessLevel?: StaffAccessLevel | null;
    emailVerified?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    staffAccessLevel?: StaffAccessLevel | null;
    emailVerified?: boolean;
  }
}
