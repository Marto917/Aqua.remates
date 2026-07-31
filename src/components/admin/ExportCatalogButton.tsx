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

function DownloadCatalogFileButton({
  className,
  label,
  loadingLabel,
  endpoint,
  acceptTypes,
  emptyError = "El archivo exportado está vacío.",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onExport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        let message = `No se pudo exportar (error ${res.status}).`;
        if (contentType.includes("application/json")) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          if (data.error) message = data.error;
        }
        throw new Error(message);
      }

      const okType = acceptTypes.some((t) => contentType.includes(t));
      if (!okType) {
        throw new Error("La respuesta del servidor no tiene el formato esperado.");
      }

      const blob = await res.blob();
      if (blob.size < 8) {
        throw new Error(emptyError);
      }

      const disposition = res.headers.get("content-disposition") ?? "";
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <button type="button" onClick={() => void onExport()} disabled={loading} className={className}>
        {loading ? loadingLabel : label}
      </button>
      {error ? (
        <p className="max-w-xs text-right text-xs text-rose-700" role="alert">
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
      acceptTypes={["application/zip", "octet-stream"]}
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
