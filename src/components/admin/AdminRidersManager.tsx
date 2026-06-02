"use client";

import { FormEvent, useState } from "react";

type RiderItem = {
  id: string;
  riderNumber: number;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
};

function formatRiderNum(n: number) {
  return `#${String(n).padStart(3, "0")}`;
}

export function AdminRidersManager({ initialRiders }: { initialRiders: RiderItem[] }) {
  const [riders, setRiders] = useState(initialRiders);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function createRider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/riders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password: fd.get("password"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el rider.");
        return;
      }
      window.location.reload();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function patchRider(
    riderId: string,
    patch: { isActive?: boolean; password?: string },
  ) {
    setError(null);
    const res = await fetch("/api/admin/riders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ riderId, ...patch }),
    });
    if (!res.ok) {
      setError("No se pudo actualizar el rider.");
      return;
    }
    if (patch.isActive !== undefined) {
      setRiders((list) =>
        list.map((r) => (r.id === riderId ? { ...r, isActive: patch.isActive! } : r)),
      );
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createRider} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Alta de repartidor (app mapas)</h2>
        <p className="md:col-span-2 text-sm text-slate-600">
          Al crear la cuenta se asigna automáticamente un <strong>número de repartidor</strong> (#001, #002…).
          El vendedor usa ese número en envíos para asignar viajes y llevar el registro de pagos.
        </p>
        <input name="name" required placeholder="Nombre y apellido" className="rounded-md border px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" className="rounded-md border px-3 py-2" />
        <input name="phone" placeholder="Teléfono / WhatsApp" className="rounded-md border px-3 py-2" />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Contraseña inicial"
          className="rounded-md border px-3 py-2"
        />
        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
        <button
          disabled={saving}
          className="md:col-span-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {saving ? "Guardando..." : "Crear cuenta de rider"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Nº</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Teléfono</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {riders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                  Todavía no hay riders. Creá la primera cuenta arriba.
                </td>
              </tr>
            ) : (
              riders.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 font-mono font-semibold text-violet-900">
                    {formatRiderNum(r.riderNumber)}
                  </td>
                  <td className="px-3 py-2 font-medium">{r.name}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.phone ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {r.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-xs font-medium text-brand-dark underline"
                        onClick={() => patchRider(r.id, { isActive: !r.isActive })}
                      >
                        {r.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        className="text-xs font-medium text-slate-600 underline"
                        onClick={() => {
                          const pwd = window.prompt("Nueva contraseña (mín. 6 caracteres):");
                          if (pwd && pwd.length >= 6) {
                            patchRider(r.id, { password: pwd });
                            window.alert("Contraseña actualizada.");
                          }
                        }}
                      >
                        Resetear clave
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
