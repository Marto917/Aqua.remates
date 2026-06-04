"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const LOGIN_CALLBACK = "/login?callbackUrl=%2Fcarrito";

export function useCustomerCartGate() {
  const { status } = useSession();
  const router = useRouter();
  const isGuest = status === "unauthenticated";

  function requireLogin(): boolean {
    if (status === "loading") return false;
    if (isGuest) {
      router.push(LOGIN_CALLBACK);
      return false;
    }
    return true;
  }

  return { isGuest, isLoading: status === "loading", requireLogin };
}
