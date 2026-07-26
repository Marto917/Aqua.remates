"use client";

import { StaffAccessLevel, UserRole } from "@prisma/client";
import { FormEvent, useMemo, useState } from "react";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffAccessLevel: StaffAccessLevel | null;
};

type RoleFilter = "ALL" | "CUSTOMERS" | "STAFF";

export function AdminUsersManager({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === "CUSTOMERS" && u.role !== "CUSTOMER") return false;
      if (roleFilter === "STAFF" && u.role === "CUSTOMER") return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    });
  }, [users, roleFilter, search]);

  const counts = useMemo(() => {
    let customers = 0;
    let staff = 0;
    for (const u of users) {
      if (u.role === "CUSTOMER") customers += 1;
      else staff += 1;
    }
    return { all: users.length, customers, staff };
  }, [users]);

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

  function startEdit(u: UserItem) {
    setEditingId(u.id);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword("");
    setError(null);
  }

  async function saveEdit(userId: string) {
    setSaving(true);
    setError(null);
    const body: Record<string, string> = { userId, name: editName.trim(), email: editEmail.trim() };
    if (editPassword.trim().length >= 6) {
      body.password = editPassword.trim();
    }
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar los cambios.");
      return;
    }
    setUsers((list) =>
      list.map((u) =>
        u.id === userId ? { ...u, name: editName.trim(), email: editEmail.trim() } : u,
      ),
    );
    setEditingId(null);
    setEditPassword("");
  }

  async function deleteUser(userId: string, name: string) {
    if (!window.confirm(`¿Eliminar la cuenta de ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }
    setError(null);
    const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
      method: "DELETE",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "No se pudo eliminar el usuario.");
      return;
    }
    setUsers((list) => list.filter((u) => u.id !== userId));
  }

  const filterBtn = (id: RoleFilter, label: string, count: number) => {
    const active = roleFilter === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setRoleFilter(id)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
          active
            ? "bg-brand text-white"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {label}{" "}
        <span className={active ? "text-white/80" : "text-slate-400"}>({count})</span>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <form onSubmit={createUser} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold">Crear usuario</h2>
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filterBtn("ALL", "Todos", counts.all)}
          {filterBtn("CUSTOMERS", "Clientes", counts.customers)}
          {filterBtn("STAFF", "Empleados", counts.staff)}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Rol</th>
              <th className="px-3 py-2 text-left">Permiso staff</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                  No hay usuarios con ese filtro.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="border-t align-top">
                  <td className="px-3 py-2">
                    {editingId === u.id ? (
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border px-2 py-1"
                      />
                    ) : (
                      u.name
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {editingId === u.id ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full rounded border px-2 py-1"
                      />
                    ) : (
                      u.email
                    )}
                  </td>
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
                  <td className="px-3 py-2 text-right">
                    {editingId === u.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Nueva contraseña (opcional)"
                          minLength={6}
                          className="w-full max-w-[200px] rounded border px-2 py-1 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEdit(u.id)}
                            disabled={saving}
                            className="rounded bg-brand px-2 py-1 text-xs font-semibold text-white"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded border px-2 py-1 text-xs"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(u)}
                          className="rounded border border-brand/40 px-2 py-1 text-xs font-medium text-brand-dark hover:bg-brand-muted"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteUser(u.id, u.name)}
                          className="rounded border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                        >
                          Borrar
                        </button>
                      </div>
                    )}
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
