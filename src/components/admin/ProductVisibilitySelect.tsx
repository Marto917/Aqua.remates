"use client";

import type { CatalogVisibility } from "@prisma/client";
import { CATALOG_VISIBILITY_LABELS } from "@/lib/catalog-visibility";

type Props = {
  productId: string;
  value: CatalogVisibility;
};

export function ProductVisibilitySelect({ productId, value }: Props) {
  return (
    <form method="post" action={`/api/admin/products/${productId}`}>
      <input type="hidden" name="intent" value="update_visibility" />
      <select
        name="catalogVisibility"
        defaultValue={value}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="max-w-[9rem] rounded-md border px-2 py-1 text-xs"
        title="Dónde se ve el producto"
      >
        {(Object.keys(CATALOG_VISIBILITY_LABELS) as CatalogVisibility[]).map((key) => (
          <option key={key} value={key}>
            {CATALOG_VISIBILITY_LABELS[key]}
          </option>
        ))}
      </select>
    </form>
  );
}
