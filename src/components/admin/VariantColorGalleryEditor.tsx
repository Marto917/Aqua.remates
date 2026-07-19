"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { resolveProductImageUrl } from "@/lib/product-images";

type ExistingImage = {
  id: string;
  imageUrl: string;
};

type Props = {
  variantId: string;
  colorLabel: string;
  existing: ExistingImage[];
  /** Máximo de fotos extras por color (además de la principal). */
  maxExtra?: number;
};

type PendingFile = {
  key: string;
  file: File;
  previewUrl: string;
};

export function VariantColorGalleryEditor({
  variantId,
  colorLabel,
  existing,
  maxExtra = 8,
}: Props) {
  const pickId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [removeIds, setRemoveIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingFile[]>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      for (const p of pendingRef.current) URL.revokeObjectURL(p.previewUrl);
    };
  }, []);

  const keptExisting = existing.filter((img) => !removeIds.has(img.id));
  const slotsLeft = Math.max(0, maxExtra - keptExisting.length - pending.length);

  function toggleRemove(id: string) {
    setRemoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const accepted: PendingFile[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (accepted.length >= slotsLeft) break;
      accepted.push({
        key: `${pickId}-${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (accepted.length === 0) return;
    setPending((prev) => [...prev, ...accepted]);
  }

  function removePending(key: string) {
    setPending((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.key !== key);
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Más fotos · {colorLabel}</p>
          <p className="text-xs text-slate-500">
            Hasta {maxExtra} fotos extras. Tocá una foto existente para marcarla a borrar; las nuevas
            se ven en verde hasta que guardés.
          </p>
        </div>
        <button
          type="button"
          disabled={slotsLeft <= 0}
          onClick={() => inputRef.current?.click()}
          className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {slotsLeft > 0 ? `Agregar fotos (${slotsLeft})` : "Límite alcanzado"}
        </button>
      </div>

      {[...removeIds].map((id) => (
        <input key={`rm-${id}`} type="hidden" name="removeGalleryImage" value={id} />
      ))}

      {pending.map((p, idx) => (
        <HiddenFileInput key={p.key} name={`variantGallery_${variantId}_${idx}`} file={p.file} />
      ))}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(e) => {
          onPickFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {keptExisting.length === 0 && pending.length === 0 && existing.length === 0 ? (
        <p className="text-xs text-slate-500">Todavía no hay fotos extras para este color.</p>
      ) : null}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {existing.map((img) => {
          const marked = removeIds.has(img.id);
          const src = resolveProductImageUrl(img.imageUrl);
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => toggleRemove(img.id)}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 bg-white transition ${
                marked
                  ? "border-rose-400 opacity-50 ring-2 ring-rose-200"
                  : "border-slate-200 hover:border-brand"
              }`}
              title={marked ? "Click para conservar" : "Click para borrar al guardar"}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="120px"
                unoptimized={src.startsWith("http")}
              />
              <span
                className={`absolute inset-x-0 bottom-0 px-1 py-0.5 text-center text-[10px] font-semibold text-white ${
                  marked ? "bg-rose-600" : "bg-black/50 opacity-0 group-hover:opacity-100"
                }`}
              >
                {marked ? "Se borrará" : "Borrar"}
              </span>
            </button>
          );
        })}

        {pending.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => removePending(p.key)}
            className="group relative aspect-square overflow-hidden rounded-lg border-2 border-emerald-300 bg-white"
            title="Quitar de la cola de subida"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-emerald-700/90 px-1 py-0.5 text-center text-[10px] font-semibold text-white">
              Nueva · quitar
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Input file oculto con el File listo para el submit del form padre. */
function HiddenFileInput({ name, file }: { name: string; file: File }) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    el.files = dt.files;
  }, [file]);

  return <input ref={ref} type="file" name={name} className="hidden" tabIndex={-1} aria-hidden />;
}
