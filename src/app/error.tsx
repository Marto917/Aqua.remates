"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-rose-100 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Algo salió mal</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error.message || "Error inesperado al cargar la página."}
      </p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-slate-400">Digest: {error.digest}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-full bg-brand px-6 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </div>
  );
}
