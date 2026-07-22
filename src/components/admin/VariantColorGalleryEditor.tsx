"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { colorLabelToDisplayName } from "@/lib/color-display";
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
  const colorName = colorLabelToDisplayName(colorLabel);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

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
    <div className="space-y-2 rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">
            Más fotos ·{" "}
            <span className="inline-flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-full border border-slate-300"
                style={{ backgroundColor: colorLabel.startsWith("#") ? colorLabel : undefined }}
                aria-hidden
              />
              {colorName}
            </span>
          </p>
          <p className="text-xs text-slate-500">
            Hasta {maxExtra} extras. Tocá una foto para marcarla a borrar.
          </p>
        </div>
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

      <div className="flex flex-wrap gap-2">
        {existing.map((img) => {
          const marked = removeIds.has(img.id);
          const src = resolveProductImageUrl(img.imageUrl);
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => toggleRemove(img.id)}
              className={`group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 bg-white transition sm:h-[4.5rem] sm:w-[4.5rem] ${
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
                sizes="72px"
                unoptimized={src.startsWith("http")}
              />
              <span
                className={`absolute inset-x-0 bottom-0 px-0.5 py-0.5 text-center text-[9px] font-semibold leading-tight text-white ${
                  marked ? "bg-rose-600" : "bg-black/55 opacity-0 group-hover:opacity-100"
                }`}
              >
                {marked ? "Borrar" : "×"}
              </span>
            </button>
          );
        })}

        {pending.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => removePending(p.key)}
            className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-emerald-300 bg-white sm:h-[4.5rem] sm:w-[4.5rem]"
            title="Quitar de la cola de subida"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-emerald-700/90 px-0.5 py-0.5 text-center text-[9px] font-semibold leading-tight text-white">
              Nueva
            </span>
          </button>
        ))}

        {slotsLeft > 0 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed border-brand/50 bg-white text-brand-dark hover:border-brand hover:bg-brand/5 sm:h-[4.5rem] sm:w-[4.5rem]"
            title="Agregar fotos"
          >
            <span className="text-lg leading-none" aria-hidden>
              +
            </span>
            <span className="text-[9px] font-semibold leading-tight">Agregar</span>
            <span className="text-[9px] text-slate-500">({slotsLeft})</span>
          </button>
        ) : (
          <p className="flex h-16 w-16 items-center justify-center text-center text-[10px] text-slate-500 sm:h-[4.5rem] sm:w-[4.5rem]">
            Límite
          </p>
        )}
      </div>

      {keptExisting.length === 0 && pending.length === 0 && existing.length === 0 ? (
        <p className="text-xs text-slate-500">Todavía no hay fotos extras para este color.</p>
      ) : null}
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
