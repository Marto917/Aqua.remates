"use client";

import { useEffect, useRef, useState } from "react";
import { ProductImage } from "@/components/ProductImage";

type Props = {
  name: string;
  positionName: string;
  label: string;
  currentUrl?: string | null;
  currentPosition?: string | null;
  aspectClass?: string;
};

export function ImageUploadPreview({
  name,
  positionName,
  label,
  currentUrl,
  currentPosition,
  aspectClass = "aspect-[4/3]",
}: Props) {
  const initial = parseObjectPosition(currentPosition ?? "50% 50%");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posX, setPosX] = useState(initial.x);
  const [posY, setPosY] = useState(initial.y);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const displayUrl = previewUrl ?? currentUrl ?? null;
  const objectPosition = `${posX}% ${posY}%`;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }
    const url = URL.createObjectURL(file);
    blobUrlRef.current = url;
    setPreviewUrl(url);
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <div className={`relative w-full overflow-hidden rounded-lg bg-slate-200 ${aspectClass}`}>
        {displayUrl ? (
          <ProductImage src={displayUrl} alt="Vista previa" position={objectPosition} sizes="400px" />
        ) : (
          <div className="flex h-full min-h-[120px] items-center justify-center text-sm text-slate-500">
            Sin imagen
          </div>
        )}
      </div>
      <p className="text-xs text-slate-500">Así se verá en la tienda. Ajustá el encuadre:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-slate-600">
          Horizontal ({posX}%)
          <input
            type="range"
            min={0}
            max={100}
            value={posX}
            onChange={(e) => setPosX(Number(e.target.value))}
            className="mt-1 w-full accent-brand"
          />
        </label>
        <label className="text-xs text-slate-600">
          Vertical ({posY}%)
          <input
            type="range"
            min={0}
            max={100}
            value={posY}
            onChange={(e) => setPosY(Number(e.target.value))}
            className="mt-1 w-full accent-brand"
          />
        </label>
      </div>
      <input type="hidden" name={positionName} value={objectPosition} />
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark"
        onChange={onFileChange}
      />
    </div>
  );
}

function parseObjectPosition(value: string): { x: number; y: number } {
  const parts = value.trim().split(/\s+/);
  const x = parsePercent(parts[0], 50);
  const y = parsePercent(parts[1] ?? parts[0], 50);
  return { x, y };
}

function parsePercent(part: string | undefined, fallback: number): number {
  if (!part) return fallback;
  const n = parseFloat(part.replace("%", ""));
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : fallback;
}
