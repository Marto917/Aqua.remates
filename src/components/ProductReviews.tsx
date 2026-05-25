"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Session } from "next-auth";
import { StarRatingInput } from "@/components/StarRatingInput";

type Review = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Props = {
  productId: string;
  initialReviews: Review[];
  session: Session | null;
  canReview?: boolean;
  reviewBlockedMessage?: string;
};

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
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      setError("Seleccioná una puntuación con las estrellas.");
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
          comment: comment.trim(),
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
        setRating(0);
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
      className="scroll-mt-24 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-4">
        <h2 className="text-lg font-semibold uppercase tracking-wide text-slate-900">
          Opiniones sobre el producto
        </h2>
        {avg ? (
          <p className="text-sm text-slate-600">
            <span className="font-bold text-amber-500">{avg}</span> / 5 · {reviews.length}{" "}
            {reviews.length === 1 ? "opinión" : "opiniones"}
          </p>
        ) : (
          <p className="text-sm text-slate-500">Todavía no hay opiniones</p>
        )}
      </div>

      {!session?.user ? (
        <p className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <Link href="/login" className="font-medium text-brand-dark underline">
            Iniciá sesión
          </Link>{" "}
          para dejar tu opinión (cuenta con al menos 7 días).
        </p>
      ) : canReview ? (
        <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-sm font-medium text-slate-800">Dejá tu opinión</p>
          <div>
            <p className="mb-2 text-sm text-slate-700">Puntuación</p>
            <StarRatingInput value={rating} onChange={setRating} />
            {rating > 0 ? (
              <p className="mt-1 text-xs text-slate-500">{rating} de 5 estrellas</p>
            ) : null}
          </div>
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
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Publicando…" : "Publicar opinión"}
          </button>
        </form>
      ) : reviewBlockedMessage ? (
        <p className="mt-5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {reviewBlockedMessage}
        </p>
      ) : null}

      <ul className="mt-6 divide-y divide-slate-100">
        {reviews.length === 0 ? (
          <li className="py-4 text-sm text-slate-500">Sé el primero en dejar tu opinión.</li>
        ) : (
          reviews.map((r) => (
            <li key={r.id} className="py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-900">{r.authorName}</span>
                <span className="text-amber-400" aria-label={`${r.rating} de 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                  ))}
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
