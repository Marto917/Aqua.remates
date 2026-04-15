"use client";

import { useState } from "react";

export function SetupDemoForm({ needsSecret }: { needsSecret: boolean }) {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/setup-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(needsSecret ? { secret } : {}),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Error");
        return;
      }
      setStatus("ok");
      setMessage(data.message ?? "Listo.");
    } catch {
      setStatus("err");
      setMessage("No se pudo conectar al servidor.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Cargar datos de demostración</h1>
      <p className="text-sm text-slate-600">
        Inserta en la base usuarios de prueba (owner, empleado, cliente) y cuatro productos con variantes.
        Podés usarlo en Vercel si no corriste <code className="rounded bg-slate-100 px-1">npm run db:seed</code> contra
        esa base.
      </p>
      {needsSecret ? (
        <label className="block text-sm">
          <span className="font-medium text-slate-700">SETUP_SECRET</span>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2"
            placeholder="Valor de la variable en el hosting"
            autoComplete="off"
          />
        </label>
      ) : (
        <p className="text-sm text-amber-800">
          Modo desarrollo: no hace falta clave. En producción definí <code className="rounded bg-amber-100 px-1">SETUP_SECRET</code> en el entorno.
        </p>
      )}
      <button
        type="submit"
        disabled={status === "loading" || (needsSecret && !secret.trim())}
        className="w-full rounded-md bg-brand px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {status === "loading" ? "Cargando…" : "Ejecutar seed demo"}
      </button>
      {message ? (
        <p className={status === "ok" ? "text-sm text-green-700" : "text-sm text-red-600"}>{message}</p>
      ) : null}
      {status === "ok" ? (
        <p className="text-sm text-slate-600">
          Luego entrá a <a className="font-medium text-brand underline" href="/login">/login</a> con{" "}
          <strong>owner@aqua.local</strong> / <strong>Owner1234</strong>.
        </p>
      ) : null}
    </form>
  );
}
