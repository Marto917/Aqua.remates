"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Session } from "next-auth";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Props = {
  productId: string;
  productName: string;
  initialReviews: Review[];
  session: Session | null;
};

export function ProductReviews({ productId, productName, initialReviews, session }: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState(session?.user?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          authorName: authorName.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; review?: Review };
      if (!res.ok) {
        setError(data.error ?? "No se pudo publicar el comentario.");
        return;
      }
      if (data.review) {
        setReviews((prev) => [data.review!, ...prev]);
        setComment("");
        router.refresh();
      }
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Opiniones sobre {productName}</h2>
        {avg ? (
          <p className="text-sm text-slate-600">
            Promedio: <span className="font-semibold text-brand-dark">{avg}</span> / 5 (
            {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"})
          </p>
        ) : (
          <p className="text-sm text-slate-500">Sin valoraciones todavía</p>
        )}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
        <p className="text-sm font-medium text-slate-800">Dejá tu valoración</p>
        {!session?.user ? (
          <label className="block text-sm text-slate-700">
            Tu nombre
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              maxLength={80}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Nombre o apodo"
            />
          </label>
        ) : null}
        <label className="block text-sm text-slate-700">
          Puntuación
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="mt-1 rounded-lg border border-slate-200 px-3 py-2"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} estrella{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-slate-700">
          Comentario
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            minLength={3}
            maxLength={2000}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            placeholder="Contanos qué te pareció el producto"
          />
        </label>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Publicando…" : "Publicar comentario"}
        </button>
      </form>

      <ul className="mt-6 divide-y divide-slate-100">
        {reviews.length === 0 ? (
          <li className="py-4 text-sm text-slate-500">Sé el primero en opinar.</li>
        ) : (
          reviews.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{r.authorName}</span>
                <span className="text-amber-500" aria-label={`${r.rating} de 5`}>
                  {"★".repeat(r.rating)}
                  <span className="text-slate-300">{"★".repeat(5 - r.rating)}</span>
                </span>
                <time className="text-xs text-slate-500">
                  {new Date(r.createdAt).toLocaleDateString("es-AR")}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{r.comment}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
