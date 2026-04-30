"use client";

import { StaffAccessLevel, UserRole } from "@prisma/client";
import { FormEvent, useState } from "react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffAccessLevel: StaffAccessLevel | null;
};

export function AdminUsersManager({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          password: fd.get("password"),
          role: fd.get("role"),
          staffAccessLevel: fd.get("staffAccessLevel"),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el usuario.");
        return;
      }
      window.location.reload();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setSaving(false);
    }
  }

  async function updateRole(userId: string, role: UserRole, staffAccessLevel: StaffAccessLevel | null) {
    const prev = users;
    setUsers((list) =>
      list.map((u) => (u.id === userId ? { ...u, role, staffAccessLevel } : u)),
    );
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role, staffAccessLevel }),
    });
    if (!res.ok) {
      setUsers(prev);
      setError("No se pudo actualizar el permiso.");
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={createUser} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Crear usuario staff/cliente</h2>
        <input name="name" required placeholder="Nombre" className="rounded-md border px-3 py-2" />
        <input name="email" type="email" required placeholder="Email" className="rounded-md border px-3 py-2" />
        <input
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Contraseña"
          className="rounded-md border px-3 py-2"
        />
        <select name="role" className="rounded-md border px-3 py-2">
          <option value="CUSTOMER">Cliente</option>
          <option value="EMPLOYEE">Empleado</option>
          <option value="OWNER">Admin principal</option>
        </select>
        <select name="staffAccessLevel" className="rounded-md border px-3 py-2 md:col-span-2">
          <option value="SELLER">Permiso vendedor</option>
          <option value="MANAGER">Permiso encargado</option>
        </select>
        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}
        <button
          disabled={saving}
          className="md:col-span-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          type="submit"
        >
          {saving ? "Guardando..." : "Crear usuario"}
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Rol</th>
              <th className="px-3 py-2 text-left">Permiso staff</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as UserRole, u.staffAccessLevel)}
                  >
                    <option value="CUSTOMER">Cliente</option>
                    <option value="EMPLOYEE">Empleado</option>
                    <option value="OWNER">Admin principal</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border px-2 py-1"
                    value={u.staffAccessLevel ?? "SELLER"}
                    onChange={(e) =>
                      updateRole(u.id, u.role, e.target.value as StaffAccessLevel)
                    }
                    disabled={u.role === "CUSTOMER"}
                  >
                    <option value="SELLER">Vendedor</option>
                    <option value="MANAGER">Encargado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
