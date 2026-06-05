"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Session } from "next-auth";
import { StarRatingInput } from "@/components/StarRatingInput";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  pros?: string | null;
  cons?: string | null;
  recommends?: boolean;
  isVerifiedBuyer?: boolean;
  createdAt: string;
};

type SortKey = "newest" | "oldest" | "highest" | "lowest";

type Props = {
  productId: string;
  initialReviews: Review[];
  session: Session | null;
  canReview?: boolean;
  reviewBlockedMessage?: string;
};

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : "text-base";
  return (
    <span className={`${cls} text-amber-400`} aria-label={`${rating} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < rating ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function maskAuthor(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return `${parts[0]?.charAt(0) ?? ""}.`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export function ProductReviews({
  productId,
  initialReviews,
  session,
  canReview = false,
  reviewBlockedMessage,
}: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [recommends, setRecommends] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [starFilter, setStarFilter] = useState<number | "all">("all");
  const [sort, setSort] = useState<SortKey>("newest");

  const stats = useMemo(() => {
    const count = reviews.length;
    const avg = count > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / count : 0;
    const recommendPct =
      count > 0
        ? Math.round((reviews.filter((r) => r.recommends !== false).length / count) * 100)
        : 0;
    const byStar = [5, 4, 3, 2, 1].map((s) => ({
      star: s,
      count: reviews.filter((r) => r.rating === s).length,
    }));
    return { count, avg, recommendPct, byStar };
  }, [reviews]);

  const filtered = useMemo(() => {
    let list = [...reviews];
    if (starFilter !== "all") list = list.filter((r) => r.rating === starFilter);
    list.sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      if (sort === "highest") return b.rating - a.rating || b.createdAt.localeCompare(a.createdAt);
      return a.rating - b.rating || b.createdAt.localeCompare(a.createdAt);
    });
    return list;
  }, [reviews, starFilter, sort]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Seleccioná una puntuación con las estrellas.");
      return;
    }
    if (!pros.trim()) {
      setError('Completá al menos "Lo bueno" del producto.');
      return;
    }
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          pros: pros.trim(),
          cons: cons.trim(),
          recommends,
        }),
      });
      const data = (await res.json()) as { error?: string; review?: Review };
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar el comentario.");
        return;
      }
      if (data.review) {
        setReviews((prev) => [data.review!, ...prev]);
        setPros("");
        setCons("");
        setRating(0);
        setRecommends(true);
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      id="opiniones-producto"
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
    >
      <h2 className="text-xl font-bold text-slate-900">Calificaciones del producto</h2>

      {stats.count > 0 ? (
        <div className="mt-6 flex flex-wrap items-center gap-8 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <Stars rating={Math.round(stats.avg)} size="lg" />
            <span className="text-4xl font-bold text-amber-500">{stats.avg.toFixed(1)}</span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {stats.count} {stats.count === 1 ? "calificación" : "calificaciones"}
          </p>
          <div className="ml-auto text-right">
            <p className="text-3xl font-bold text-slate-600">{stats.recommendPct}%</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              de los compradores lo recomiendan
            </p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500">Todavía no hay calificaciones.</p>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6 text-sm">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              Filtrar calificaciones:
            </p>
            <ul className="space-y-1">
              <li>
                <button
                  type="button"
                  onClick={() => setStarFilter("all")}
                  className={`text-left ${starFilter === "all" ? "font-semibold text-brand-dark" : "text-slate-600 hover:text-slate-900"}`}
                >
                  → Mostrar todos ({stats.count})
                </button>
              </li>
              {stats.byStar.map(({ star, count }) => (
                <li key={star}>
                  <button
                    type="button"
                    onClick={() => setStarFilter(star)}
                    className={`flex items-center gap-1 ${starFilter === star ? "font-semibold text-brand-dark" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    <Stars rating={star} /> ({count})
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Ordenar por:
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
            >
              <option value="newest">Más nuevos</option>
              <option value="oldest">Más antiguos</option>
              <option value="highest">Mayor puntuación</option>
              <option value="lowest">Menor puntuación</option>
            </select>
          </div>
        </aside>

        <div>
          {!session?.user ? (
            <p className="mb-6 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <Link href="/login" className="font-medium text-brand-dark underline">
                Iniciá sesión
              </Link>{" "}
              para dejar tu calificación (cuenta con al menos 7 días).
            </p>
          ) : canReview ? (
            <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-sm font-medium text-slate-800">Dejá tu calificación</p>
              <div>
                <p className="mb-2 text-sm text-slate-700">Puntuación</p>
                <StarRatingInput value={rating} onChange={setRating} />
              </div>
              <label className="block text-sm text-slate-700">
                Lo bueno:
                <textarea
                  value={pros}
                  onChange={(e) => setPros(e.target.value)}
                  required
                  minLength={3}
                  maxLength={1000}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="¿Qué te gustó del producto?"
                />
              </label>
              <label className="block text-sm text-slate-700">
                Lo malo: <span className="text-slate-400">(opcional)</span>
                <textarea
                  value={cons}
                  onChange={(e) => setCons(e.target.value)}
                  maxLength={1000}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Dejá en blanco si no hay nada negativo"
                />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={recommends}
                  onChange={(e) => setRecommends(e.target.checked)}
                />
                Recomiendo este producto
              </label>
              {error ? <p className="text-sm text-rose-600">{error}</p> : null}
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {pending ? "Publicando…" : "Publicar calificación"}
              </button>
            </form>
          ) : reviewBlockedMessage ? (
            <p className="mb-6 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {reviewBlockedMessage}
            </p>
          ) : null}

          <ul className="divide-y divide-slate-200">
            {filtered.length === 0 ? (
              <li className="py-8 text-center text-sm text-slate-500">
                No hay calificaciones con este filtro.
              </li>
            ) : (
              filtered.map((r) => (
                <li key={r.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Stars rating={r.rating} />
                      <span className="font-semibold text-slate-900">{maskAuthor(r.authorName)}</span>
                      {r.isVerifiedBuyer ? (
                        <span className="text-xs text-slate-500">— Comprador verificado</span>
                      ) : null}
                    </div>
                    <time className="text-xs text-slate-500">{formatReviewDate(r.createdAt)}</time>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-slate-800">
                    <p>
                      <strong>Lo bueno:</strong> {r.pros || r.comment}
                    </p>
                    <p>
                      <strong>Lo malo:</strong> {r.cons?.trim() ? r.cons : "NADA"}
                    </p>
                  </div>
                  {r.recommends !== false ? (
                    <p className="mt-3 text-sm font-medium text-emerald-700">
                      ✓ Recomiendo este producto
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
