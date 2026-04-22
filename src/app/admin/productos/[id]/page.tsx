import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORY_NAMES } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { resolveProductImageUrl } from "@/lib/product-images";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
};

export default async function AdminProductoImagenesPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { ok, error } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link href="/admin/productos" className="text-sm text-brand-dark hover:underline">
            ← Volver a catálogo
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Imágenes de {product.name}
          </h1>
          <p className="text-sm text-slate-600">
            Categoría: {product.category.name} · Variantes: {product.variants.length}
          </p>
        </div>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Imágenes actualizadas correctamente.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <form
        method="post"
        action={`/api/admin/products/${product.id}`}
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="intent" value="update_category" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
          Editar categoría
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Categoría del producto</span>
            <select
              name="categoryName"
              defaultValue={CATEGORY_NAMES.includes(product.category.name as (typeof CATEGORY_NAMES)[number]) ? product.category.name : ""}
              required
              className="rounded-md border px-3 py-2"
            >
              <option value="" disabled>
                Seleccionar categoría
              </option>
              {CATEGORY_NAMES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center rounded-full border border-brand px-4 py-2 text-sm font-semibold text-brand-dark hover:bg-brand-muted"
          >
            Guardar categoría
          </button>
        </div>
      </form>

      <form
        method="post"
        action={`/api/admin/products/${product.id}`}
        encType="multipart/form-data"
        className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="intent" value="update_images" />

        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Imagen principal
          </h2>
          <div className="flex flex-wrap items-start gap-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <Image
                src={resolveProductImageUrl(product.imageUrl)}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-2">
              <input
                type="file"
                name="productImageFile"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="clearProductImage" />
                Volver a imagen predeterminada
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Imágenes por color
          </h2>
          {product.variants.length === 0 ? (
            <p className="text-sm text-slate-600">Este producto no tiene variantes.</p>
          ) : (
            <div className="space-y-3">
              {product.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-[120px_1fr]"
                >
                  <div className="relative h-24 w-24 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                    <Image
                      src={resolveProductImageUrl(variant.imageUrl || product.imageUrl)}
                      alt={variant.colorLabel}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{variant.colorLabel}</p>
                    <p className="mb-2 text-xs text-slate-500">
                      Si no cargás imagen, usa la principal.
                    </p>
                    <input
                      type="file"
                      name={`variantImage_${variant.id}`}
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Guardar imágenes
        </button>
      </form>
    </section>
  );
}
