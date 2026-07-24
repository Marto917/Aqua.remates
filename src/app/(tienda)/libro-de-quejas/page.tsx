import { LibroQuejasForm } from "@/components/LibroQuejasForm";
import { getTurnstileSiteKey } from "@/lib/turnstile";

export default function LibroDeQuejasPage() {
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Ayuda – Libro de quejas online</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Libro de quejas online</h1>
        <p className="mt-2 text-sm text-slate-600">
          Libro de quejas, agradecimientos, sugerencias y reclamos:
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <LibroQuejasForm turnstileSiteKey={turnstileSiteKey} />
      </div>
    </div>
  );
}
