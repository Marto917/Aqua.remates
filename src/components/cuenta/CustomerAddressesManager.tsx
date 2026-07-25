"use client";

import { useState } from "react";
import type { CustomerAddressDTO } from "@/lib/customer-address-types";
import { MAX_CUSTOMER_ADDRESSES } from "@/lib/customer-address-types";

type Props = {
  phone: string;
  initialAddresses: CustomerAddressDTO[];
  updatePhoneAction: (formData: FormData) => Promise<void>;
};

type Draft = {
  label: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  isDefault: boolean;
};

const emptyDraft = (): Draft => ({
  label: "",
  address: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
  isDefault: false,
});

export function CustomerAddressesManager({ phone: initialPhone, initialAddresses, updatePhoneAction }: Props) {
  const [phone, setPhone] = useState(initialPhone);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const atLimit = addresses.length >= MAX_CUSTOMER_ADDRESSES;

  async function refresh() {
    const res = await fetch("/api/account/shipping-profile");
    const data = (await res.json()) as { addresses?: CustomerAddressDTO[] };
    if (data.addresses) setAddresses(data.addresses);
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (atLimit) {
      setError(`Máximo ${MAX_CUSTOMER_ADDRESSES} direcciones. Eliminá una para guardar otra.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/account/shipping-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setDraft(emptyDraft());
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onUpdate(e: React.FormEvent, id: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo actualizar.");
        return;
      }
      setEditingId(null);
      setDraft(emptyDraft());
      await refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta dirección?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("No se pudo eliminar.");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onSetDefault(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/account/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setDefaultOnly: true }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function startEdit(addr: CustomerAddressDTO) {
    setEditingId(addr.id);
    setDraft({
      label: addr.label ?? "",
      address: addr.address,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      notes: addr.notes ?? "",
      isDefault: addr.isDefault,
    });
  }

  return (
    <div className="mt-6 space-y-5">
      <form action={updatePhoneAction} className="space-y-3">
        <p className="text-sm font-medium text-slate-800">Teléfono</p>
        <input
          name="phone"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Teléfono / WhatsApp"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand/5"
        >
          Guardar teléfono
        </button>
      </form>

      <div>
        <h3 className="text-sm font-medium text-slate-800">
          Direcciones guardadas ({addresses.length}/{MAX_CUSTOMER_ADDRESSES})
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Podés guardar hasta {MAX_CUSTOMER_ADDRESSES}. Si necesitás una sexta en un pedido, se usa para
          el envío pero no se guarda.
        </p>
      </div>

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <ul className="space-y-3">
        {addresses.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
            Todavía no tenés direcciones guardadas.
          </li>
        ) : (
          addresses.map((addr) => (
            <li key={addr.id} className="rounded-lg border border-slate-200 p-3">
              {editingId === addr.id ? (
                <AddressDraftForm
                  draft={draft}
                  setDraft={setDraft}
                  busy={busy}
                  submitLabel="Guardar cambios"
                  onSubmit={(e) => void onUpdate(e, addr.id)}
                  onCancel={() => {
                    setEditingId(null);
                    setDraft(emptyDraft());
                  }}
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-slate-900">
                        {addr.label || "Dirección"}
                        {addr.isDefault ? (
                          <span className="ml-2 text-xs font-semibold text-brand-dark">(principal)</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {addr.address}, {addr.city} ({addr.province}) — CP {addr.postalCode}
                      </p>
                      {addr.notes ? <p className="text-xs text-slate-500">{addr.notes}</p> : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!addr.isDefault ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void onSetDefault(addr.id)}
                          className="text-xs font-medium text-brand-dark underline"
                        >
                          Usar como principal
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startEdit(addr)}
                        className="text-xs font-medium text-slate-700 underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void onDelete(addr.id)}
                        className="text-xs font-medium text-rose-700 underline"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))
        )}
      </ul>

      {!editingId ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {atLimit ? "Límite alcanzado" : "Agregar dirección"}
          </p>
          {atLimit ? (
            <p className="mt-2 text-sm text-amber-800">
              Ya tenés {MAX_CUSTOMER_ADDRESSES} direcciones. Eliminá una para poder guardar otra. En el
              checkout igual podés cargar una dirección extra solo para ese pedido.
            </p>
          ) : (
            <AddressDraftForm
              draft={draft}
              setDraft={setDraft}
              busy={busy}
              submitLabel="Agregar dirección"
              onSubmit={(e) => void onAdd(e)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function AddressDraftForm({
  draft,
  setDraft,
  busy,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  busy: boolean;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <input
        value={draft.label}
        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
        placeholder="Etiqueta (Casa, Trabajo…)"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        required
        value={draft.address}
        onChange={(e) => setDraft({ ...draft, address: e.target.value })}
        placeholder="Calle y número"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          required
          value={draft.city}
          onChange={(e) => setDraft({ ...draft, city: e.target.value })}
          placeholder="Ciudad"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          required
          value={draft.province}
          onChange={(e) => setDraft({ ...draft, province: e.target.value })}
          placeholder="Provincia"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
      <input
        required
        value={draft.postalCode}
        onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
        placeholder="Código postal"
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <textarea
        value={draft.notes}
        onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        placeholder="Referencias (piso, timbre…)"
        rows={2}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
        />
        Usar como dirección principal
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
        >
          {busy ? "Guardando…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Cancelar
          </button>
        ) : null}
      </div>
    </form>
  );
}
