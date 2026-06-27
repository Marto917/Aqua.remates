"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { resolveUserAvatarUrl } from "@/lib/user-avatar";

type Props = {
  initialImageUrl: string | null;
  userName: string;
};

export function CustomerProfileAvatarForm({ initialImageUrl, userName }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(() => resolveUserAvatarUrl(initialImageUrl));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Elegí una foto de tu dispositivo.");
      return;
    }

    setSaving(true);
    setError(null);
    setOk(false);

    const fd = new FormData();
    fd.set("avatar", file);

    try {
      const res = await fetch("/api/account/profile-avatar", { method: "POST", body: fd });
      const data = (await res.json()) as { error?: string; imageUrl?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la foto.");
        return;
      }
      if (data.imageUrl) {
        setPreview(data.imageUrl);
      }
      setOk(true);
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-brand/30 bg-brand-muted">
          <Image
            src={preview}
            alt="Vista previa de tu foto"
            width={96}
            height={96}
            className="h-full w-full object-cover"
            unoptimized={preview.startsWith("http") || preview.startsWith("blob:")}
          />
        </span>
        <div className="w-full flex-1 space-y-2 text-center sm:text-left">
          <p className="text-lg font-semibold text-slate-900">{userName}</p>
          <label className="block text-sm font-medium text-slate-700" htmlFor="avatar-file">
            Cambiar foto de perfil
          </label>
          <input
            id="avatar-file"
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setError(null);
              setOk(false);
              if (file) setPreview(URL.createObjectURL(file));
              else setPreview(resolveUserAvatarUrl(initialImageUrl));
            }}
            className="w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-brand-dark"
          />
          <p className="text-xs text-slate-500">JPG, PNG o WebP · máximo 12 MB</p>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {ok ? <p className="text-sm text-emerald-700">Foto actualizada.</p> : null}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Subiendo…" : "Guardar foto"}
      </button>
    </form>
  );
}
