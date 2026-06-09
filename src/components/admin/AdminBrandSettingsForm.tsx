"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

type BrandContact = {
  storePhone: string | null;
  storeInstagram: string | null;
  storeTiktok: string | null;
  storeAddress: string | null;
};

type Props = {
  logoUrl: string | null;
  contact: BrandContact;
};

export function AdminBrandSettingsForm({ logoUrl: initialLogo, contact: initialContact }: Props) {
  const [logoUrl, setLogoUrl] = useState(initialLogo);
  const [contact, setContact] = useState({
    storePhone: initialContact.storePhone ?? "",
    storeInstagram: initialContact.storeInstagram ?? "",
    storeTiktok: initialContact.storeTiktok ?? "",
    storeAddress: initialContact.storeAddress ?? "",
  });
  const [logoSaving, setLogoSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [logoMsg, setLogoMsg] = useState<string | null>(null);
  const [contactMsg, setContactMsg] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  async function onLogoSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLogoSaving(true);
    setLogoMsg(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/brand-logo", { method: "POST", body: fd });
    const data = (await res.json()) as { error?: string; brandLogoUrl?: string | null };
    setLogoSaving(false);
    if (!res.ok) {
      setLogoMsg(data.error ?? "No se pudo guardar el logo.");
      return;
    }
    setLogoUrl(data.brandLogoUrl ?? null);
    setLogoMsg("Logo actualizado.");
  }

  async function onContactSubmit(e: FormEvent) {
    e.preventDefault();
    setContactSaving(true);
    setContactError(null);
    setContactMsg(null);
    const res = await fetch("/api/admin/brand-contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(contact),
    });
    const data = (await res.json()) as { error?: string };
    setContactSaving(false);
    if (!res.ok) {
      setContactError(data.error ?? "No se pudo guardar.");
      return;
    }
    setContactMsg("Datos de contacto guardados.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onLogoSubmit} className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-slate-900">Logo de la marca</h2>
        <p className="text-sm text-slate-600">
          Se muestra en el encabezado de la tienda. Recomendado cuadrado, mínimo 200×200 px.
        </p>
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-slate-50 ring-2 ring-brand/15">
            <Image
              src={logoUrl ? resolveProductImageUrl(logoUrl) : "/logo-aqua.png"}
              alt="Logo"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          {logoUrl ? (
            <p className="text-xs text-slate-500">Logo personalizado activo</p>
          ) : (
            <p className="text-xs text-slate-500">Usando logo por defecto</p>
          )}
        </div>
        <input type="file" name="brandLogo" accept="image/jpeg,image/png,image/webp" className="text-sm" />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="clearLogo" />
          Volver al logo por defecto
        </label>
        {logoMsg ? (
          <p className={`text-sm ${logoMsg.includes("actualizado") ? "text-emerald-700" : "text-rose-600"}`}>
            {logoMsg}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={logoSaving}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {logoSaving ? "Guardando…" : "Guardar logo"}
        </button>
      </form>

      <form onSubmit={onContactSubmit} className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold text-slate-900">Contacto y sucursal</h2>
        <p className="text-sm text-slate-600">
          Aparece en el pie de página de la tienda. Instagram/TikTok: URL completa o @usuario.
        </p>
        <label className="block text-sm text-slate-700">
          Teléfono / WhatsApp
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={contact.storePhone}
            onChange={(e) => setContact({ ...contact, storePhone: e.target.value })}
            placeholder="11 6115-3502"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Instagram
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={contact.storeInstagram}
            onChange={(e) => setContact({ ...contact, storeInstagram: e.target.value })}
            placeholder="@aqua.remates o URL"
          />
        </label>
        <label className="block text-sm text-slate-700">
          TikTok
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={contact.storeTiktok}
            onChange={(e) => setContact({ ...contact, storeTiktok: e.target.value })}
            placeholder="@aqua.remates o URL"
          />
        </label>
        <label className="block text-sm text-slate-700">
          Dirección casa central (retiro / referencia)
          <textarea
            className="mt-1 w-full rounded-md border px-3 py-2"
            rows={2}
            value={contact.storeAddress}
            onChange={(e) => setContact({ ...contact, storeAddress: e.target.value })}
            placeholder="Calle, número, ciudad"
          />
        </label>
        {contactError ? <p className="text-sm text-rose-600">{contactError}</p> : null}
        {contactMsg ? <p className="text-sm text-emerald-700">{contactMsg}</p> : null}
        <button
          type="submit"
          disabled={contactSaving}
          className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {contactSaving ? "Guardando…" : "Guardar contacto"}
        </button>
      </form>
    </div>
  );
}
