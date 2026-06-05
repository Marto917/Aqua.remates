import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminProductEditDetails } from "@/components/admin/AdminProductEditDetails";
import { ImageUploadPreview } from "@/components/admin/ImageUploadPreview";
import { IconCamera } from "@/components/icons/StaffIcons";
import { prisma } from "@/lib/prisma";

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
    include: {
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { images: { orderBy: { sortOrder: "asc" } } },
      },
      category: true,
    },
  });

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

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
            Editar {product.name}
          </h1>
          <p className="text-sm text-slate-600">
            Categoría: {product.category.name} · Variantes: {product.variants.length}
          </p>
        </div>
      </div>

      {ok ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Cambios guardados correctamente.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <AdminProductEditDetails
        productId={product.id}
        name={product.name}
        sku={product.sku}
        description={product.description}
        supplierName={product.supplierName}
        listPrice={Number(product.listPrice)}
        transferPrice={Number(product.retailPrice)}
        wholesalePrice={Number(product.wholesalePrice)}
        categories={categories}
        categoryName={product.category.name}
      />

      <form
        id="imagenes"
        method="post"
        action={`/api/admin/products/${product.id}`}
        encType="multipart/form-data"
        className="scroll-mt-24 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <input type="hidden" name="intent" value="update_images" />

        <ImageUploadPreview
          name="productImageFile"
          positionName="productImagePosition"
          scaleName="productImageScale"
          label="Imagen principal (vista en catálogo y ficha)"
          currentUrl={product.imageUrl}
          currentPosition={product.imagePosition}
          currentScale={product.imageScale}
          previewMode="card"
        />

        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="clearProductImage" />
          Volver a imagen predeterminada
        </label>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
            Imágenes por color
          </h2>
          {product.variants.length === 0 ? (
            <p className="text-sm text-slate-600">Este producto no tiene variantes.</p>
          ) : (
            product.variants.map((variant) => (
              <div key={variant.id} className="space-y-3 rounded-lg border border-slate-100 p-4">
                <ImageUploadPreview
                  name={`variantImage_${variant.id}`}
                  positionName={`variantImagePosition_${variant.id}`}
                  scaleName={`variantImageScale_${variant.id}`}
                  label={`Color: ${variant.colorLabel} (foto principal)`}
                  currentUrl={variant.imageUrl || product.imageUrl}
                  currentPosition={variant.imagePosition ?? product.imagePosition}
                  currentScale={variant.imageScale ?? product.imageScale}
                />
                {variant.images.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-600">
                    {variant.images.map((img) => (
                      <li key={img.id} className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                          <input type="checkbox" name="removeGalleryImage" value={img.id} />
                          Quitar foto extra
                        </label>
                        <span className="truncate text-xs text-slate-400">{img.imageUrl}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-3">
                  {[0, 1, 2].map((idx) => (
                    <label key={idx} className="text-xs text-slate-600">
                      Foto galería {idx + 1}
                      <input
                        type="file"
                        name={`variantGallery_${variant.id}_${idx}`}
                        accept="image/jpeg,image/png,image/webp"
                        className="mt-1 block w-full text-xs"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="submit"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark"
          aria-label="Guardar imágenes"
          title="Guardar imágenes"
        >
          <IconCamera className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
