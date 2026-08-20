"use client";

import { useState } from "react";

type Props = {
  className?: string;
  label?: string;
  loadingLabel?: string;
  endpoint: string;
  acceptTypes: string[];
  emptyError?: string;
};

function formatMb(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isZipLike(contentType: string, disposition: string): boolean {
  const ct = contentType.toLowerCase();
  if (
    ct.includes("application/zip") ||
    ct.includes("application/x-zip") ||
    ct.includes("application/octet-stream") ||
    ct.includes("zip")
  ) {
    return true;
  }
  return /filename="?[^"]+\.zip"?/i.test(disposition);
}

function isCsvLike(contentType: string, disposition: string): boolean {
  const ct = contentType.toLowerCase();
  if (ct.includes("text/csv") || ct.includes("text/plain") || ct.includes("application/csv")) {
    return true;
  }
  return /filename="?[^"]+\.csv"?/i.test(disposition);
}

function DownloadCatalogFileButton({
  className,
  label,
  loadingLabel,
  endpoint,
  acceptTypes,
  emptyError = "El archivo exportado está vacío.",
  showProgress = false,
}: Props & { showProgress?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [bytesReceived, setBytesReceived] = useState(0);

  async function onExport() {
    setLoading(true);
    setError(null);
    setStatus(showProgress ? "Preparando catálogo…" : (loadingLabel ?? "Exportando…"));
    setProgress(showProgress ? 8 : null);
    setBytesReceived(0);

    let pulse: ReturnType<typeof setInterval> | null = null;
    if (showProgress) {
      pulse = setInterval(() => {
        setProgress((prev) => {
          if (prev == null || prev >= 40) return prev;
          return prev + 1;
        });
      }, 900);
    }

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") ?? "";
      const disposition = res.headers.get("content-disposition") ?? "";
      const productCount = res.headers.get("x-aqua-export-products");

      if (!res.ok) {
        let message = `No se pudo exportar (error ${res.status}).`;
        if (contentType.includes("application/json")) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (data.error) message = data.error;
        } else if (res.status === 401) {
          message = "No autorizado. Volvé a iniciar sesión.";
        } else if (res.status === 504 || res.status === 408) {
          message =
            "La exportación tardó demasiado. Probá de nuevo o usá «Exportar texto (POS)».";
        }
        throw new Error(message);
      }

      const isZip = endpoint.includes("export-catalog") && !endpoint.includes("text");
      const okType = isZip
        ? isZipLike(contentType, disposition)
        : acceptTypes.some((t) => contentType.includes(t)) ||
          isCsvLike(contentType, disposition);

      if (!okType && contentType.includes("application/json")) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "La respuesta del servidor no tiene el formato esperado.");
      }
      if (!okType) {
        throw new Error("La respuesta del servidor no tiene el formato esperado.");
      }

      setStatus(
        showProgress
          ? productCount
            ? `Empaquetando ${productCount} artículos e imágenes…`
            : "Empaquetando imágenes…"
          : (loadingLabel ?? "Descargando…"),
      );
      setProgress((p) => Math.max(p ?? 0, 20));

      const chunks: BlobPart[] = [];
      let received = 0;
      const totalHeader = Number(res.headers.get("content-length") ?? "0");
      const hasTotal = Number.isFinite(totalHeader) && totalHeader > 0;

      if (res.body) {
        const reader = res.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            if (pulse) {
              clearInterval(pulse);
              pulse = null;
            }
            chunks.push(value);
            received += value.byteLength;
            setBytesReceived(received);
            if (showProgress) {
              if (hasTotal) {
                setProgress(Math.min(95, Math.round(25 + (received / totalHeader) * 70)));
              } else {
                setProgress((prev) => Math.min(92, Math.max(prev ?? 25, 25) + 2));
                setStatus(`Descargando ZIP… ${formatMb(received)}`);
              }
            }
          }
        }
      } else {
        const blobFallback = await res.blob();
        chunks.push(blobFallback);
        received = blobFallback.size;
        setBytesReceived(received);
      }

      const blob = new Blob(chunks, {
        type: isZip ? "application/zip" : "text/csv;charset=utf-8",
      });
      if (blob.size < 8) {
        throw new Error(emptyError);
      }

      setProgress(100);
      setStatus(showProgress ? `Listo · ${formatMb(blob.size)} — descargando…` : null);

      const match = /filename="([^"]+)"/i.exec(disposition);
      const fallback =
        endpoint.includes("text") || contentType.includes("csv")
          ? `aqua-articulos-pos-${new Date().toISOString().slice(0, 10)}.csv`
          : `aqua-catalogo-${new Date().toISOString().slice(0, 10)}.zip`;
      const filename = match?.[1] ?? fallback;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo exportar.");
      setStatus(null);
      setProgress(null);
      setBytesReceived(0);
    } finally {
      if (pulse) clearInterval(pulse);
      setLoading(false);
      window.setTimeout(() => {
        setStatus(null);
        setProgress(null);
        setBytesReceived(0);
      }, 1500);
    }
  }

  const showBar = showProgress && (loading || (progress != null && progress > 0));

  return (
    <div className="flex min-w-[12rem] flex-col items-stretch gap-1.5 sm:items-end">
      <button type="button" onClick={() => void onExport()} disabled={loading} className={className}>
        {loading ? (showProgress ? "Exportando…" : loadingLabel) : label}
      </button>

      {showBar ? (
        <div className="w-full min-w-[11rem] max-w-xs space-y-1 sm:text-right">
          {status ? <p className="text-left text-xs text-slate-600 sm:text-right">{status}</p> : null}
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress ?? 0}
            aria-label="Progreso de exportación"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(progress ?? 8, 8)}%` }}
            />
          </div>
          {bytesReceived > 0 && (progress ?? 0) < 100 ? (
            <p className="text-left text-[10px] text-slate-500 sm:text-right">
              {formatMb(bytesReceived)} recibidos
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="max-w-xs text-left text-xs text-rose-700 sm:text-right" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const defaultBtn =
  "inline-flex min-h-11 shrink-0 items-center rounded-full border border-brand bg-white px-4 py-2 text-sm font-medium text-brand-dark hover:bg-brand-muted/50 disabled:opacity-60";

export function ExportCatalogButton({
  className = defaultBtn,
  label = "Exportar ZIP",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <DownloadCatalogFileButton
      className={className}
      label={label}
      loadingLabel="Generando ZIP…"
      endpoint="/api/admin/export-catalog"
      acceptTypes={["application/zip", "octet-stream", "x-zip"]}
      showProgress
    />
  );
}

/** CSV de texto para cargar artículos en un POS / Excel. */
export function ExportCatalogTextButton({
  className = defaultBtn,
  label = "Exportar texto (POS)",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <DownloadCatalogFileButton
      className={className}
      label={label}
      loadingLabel="Generando CSV…"
      endpoint="/api/admin/export-catalog-text"
      acceptTypes={["text/csv", "text/plain", "application/csv"]}
      emptyError="El archivo de texto está vacío."
    />
  );
}
