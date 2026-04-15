"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const result = await signIn("credentials", {
          email: form.get("email"),
          password: form.get("password"),
          callbackUrl,
          redirect: false,
        });

        if (result?.error) {
          setError("Credenciales invalidas.");
          setLoading(false);
          return;
        }

        window.location.href = result?.url ?? callbackUrl;
      }}
    >
      <input
        required
        type="email"
        name="email"
        placeholder="Email"
        className="w-full rounded-md border px-3 py-2"
      />
      <input
        required
        type="password"
        name="password"
        placeholder="Contrasena"
        className="w-full rounded-md border px-3 py-2"
      />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        type="submit"
        className="w-full rounded-md bg-brand px-4 py-2 text-white disabled:opacity-70"
      >
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
