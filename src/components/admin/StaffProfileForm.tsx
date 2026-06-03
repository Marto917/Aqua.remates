"use client";

import Image from "next/image";
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function StaffProfileForm({
  initialName,
  initialImageUrl,
}: {
  initialName: string;
  initialImageUrl: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initialName);
  const [preview, setPreview] = useState<string | null>(initialImageUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function onFileChange() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    const fd = new FormData();
    fd.set("name", name.trim());
    const file = fileRef.current?.files?.[0];
    if (file) fd.set("avatar", file);

    try {
      const res = await fetch("/api/staff/profile", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; imageUrl?: string | null };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      if (data.imageUrl) setPreview(data.imageUrl);
      setOk(true);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {preview ? (
            <Image src={preview} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full items-center justify-center text-2xl text-slate-400">👤</span>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Foto de perfil</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onFileChange}
            className="mt-2 max-w-full text-xs"
          />
        </div>
      </div>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Nombre visible</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
          className="mt-1 w-full rounded-md border px-3 py-2"
        />
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Perfil actualizado.</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar perfil"}
      </button>
    </form>
  );
}
