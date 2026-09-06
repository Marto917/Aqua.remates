# Módulos, rutas y APIs

Mapa funcional del código. Rutas relativas a `src/` salvo que se indique otra cosa.

---

## Tienda (cliente)

| Función | Dónde |
|---------|--------|
| Home | `app/(tienda)/page.tsx` — hero, carrusel, ribbon, lanzamientos |
| Catálogo | `app/(tienda)/catalog`, `lib/catalog.ts`, `components/CatalogToolbarClient.tsx` |
| Ficha producto | `app/(tienda)/product/[slug]` |
| Carrito | `app/(tienda)/carrito`, contexto/carrito retail |
| Checkout retail | `app/(tienda)/checkout`, `api/retail-checkout` |
| Mayorista | `app/(tienda)/mayorista/*`, `api/wholesale-checkout` |
| Cuenta | `app/(tienda)/cuenta/*` |
| Promos públicas | `app/(tienda)/promociones`, modelo `StorePromo` |
| Login / registro | `app/(tienda)/login`, `registro` |

### Home / marketing visual

| Pieza | Lib / componente |
|-------|------------------|
| Hero banner (desktop/mobile) | `lib/hero-promo.ts`, `components/home/HomeHeroPromo.tsx` — **object-contain** |
| Carrusel banners | `components/PromoCarousel.tsx` — aspect **16:5**, object-contain |
| Cinta | `components/home/HomePromoRibbon.tsx` |
| Admin de todo eso | `app/(staff)/admin/promociones`, `AdminHeroPromoManager`, `AdminBannersManager`, `AdminHomeRibbonForm` |

Specs carrusel: `lib/banner-image-specs.ts` (1920×600 / 16:5).

---

## Catálogo admin

| Función | Dónde |
|---------|--------|
| Listado + filtros | `app/(staff)/admin/productos/page.tsx`, `components/admin/AdminCatalogFilters.tsx` |
| Alta | `AdminProductCreatePanel` / `AdminProductCreateForm` |
| Edición | `admin/productos/[id]`, `AdminProductEditDetails`, galería variantes |
| Barcodes múltiples | `ProductBarcodesEditor`, `lib/product-barcodes.ts`, `lib/replace-product-barcodes.ts` |
| Completitud | `lib/product-completeness.ts` (código, imagen, precios, color activo…) |
| Visibilidad | `ProductVisibilitySelect`, `lib/catalog-visibility.ts` |
| API productos | `api/admin/products`, `api/admin/products/[id]` |
| Imágenes | `lib/save-product-image.ts` (WebP, maxSide configurable) |

### Filtros listado (query params)

`q`, `category`, `active` (1/0), `visibility`, `supplier`, `incomplete=1`.

### Import Mercado Libre (1 link)

| Pieza | Archivo |
|-------|---------|
| Parse + fetch API ML | `lib/meli-item.ts` |
| Endpoint | `api/admin/import-meli` |
| UI | bloque en `AdminProductCreateForm` |
| Env | `MELI_ACCESS_TOKEN` |

Precarga: nombre, descripción, fotos (a uploads), EAN si hay.  
**No** copia el precio de ML al `listPrice` (solo referencia). Staff completa categoría, proveedor y precios.

### Export catálogo

| Tipo | Endpoint | UI |
|------|----------|-----|
| ZIP (JSON + imágenes) | `api/admin/export-catalog` | `ExportCatalogButton` — streaming + barra progreso |
| CSV POS (`;`, UTF-8 BOM) | `api/admin/export-catalog-text` | `ExportCatalogTextButton` |
| Reimport | `npm run import:catalog` → `scripts/import-catalog.ts` | |

ZIP: `catalog-aqua.json` + `public/uploads/products/` + `LEEME.txt`.  
Remotas CDN: hasta 80, concurrency 3. Locales del volume: todas.

---

## Pedidos y packing

| Función | Dónde |
|---------|--------|
| Pedidos admin | `admin/pedidos`, papelera soft-delete |
| Pedidos vendedor | `vendedor/pedidos` |
| Armar envío | `vendedor/envios/.../armar`, `OrderPickPanel`, scanner barcodes |
| Tickets / QR | `lib/shipping-ticket.ts` |
| Lookup externo | API shipping + `SHIPPING_LOOKUP_KEY` (fail-closed) |
| Webhook MP | `api/webhooks/mercadopago` |

Estados retail típicos: `PENDING_PAYMENT`, `PENDING_TRANSFER`, `TRANSFER_REPORTED`, `PAYMENT_APPROVED`, `CONFIRMED`, `CANCELLED`, etc. (ver schema).

---

## Envíos y tarifas

| Función | Dónde |
|---------|--------|
| Quote | `api/shipping/quote` |
| Settings tarifas | `StoreSettings` + admin envíos/promos |
| Métodos | `PICKUP`, `DELIVERY`, `SHIPPING_TO_COORDINATE` |
| Free shipping rules | `lib/free-shipping.ts`, admin |

---

## Promos y precios

| Función | Dónde |
|---------|--------|
| Promo catálogo (global / por categoría) | `lib/catalog-promo.ts`, `AdminCatalogPromoManager` |
| Códigos | `admin/codigos`, `api/promo-codes/validate`, `lib/promo-codes.ts` |
| Display precio ficha/card | `lib/product-promo.ts`, `ProductPriceBlock`, `ProductCard` |
| Transferencia vs lista | `lib/store-pricing.ts`, `product-pricing-display.ts` |

---

## Staff UI

| Pieza | Archivo |
|-------|---------|
| Nav admin/vendedor | `components/staff/StaffNav.tsx` |
| Login staff | path `STAFF_LOGIN_PATH` |
| Mobile nav | `StaffMobileNav` (cuidado backdrop desktop) |

---

## Utilidades críticas

| Lib | Para qué |
|-----|----------|
| `lib/app-url.ts` | Origen canónico, redirects post-guardar producto |
| `lib/get-session.ts` | Sesión segura |
| `lib/uploads-paths.ts` | Directorio uploads |
| `lib/nextauth-secret.ts` | Validación secret en boot/health |
| `lib/backoffice-preview.ts` | Preview solo local |

---

## APIs admin (muestra)

```
/api/admin/products
/api/admin/products/[id]
/api/admin/import-meli
/api/admin/export-catalog
/api/admin/export-catalog-text
/api/admin/banners
/api/admin/hero-promo
/api/admin/home-ribbon
/api/admin/catalog-promo
/api/admin/promo-codes
/api/admin/store-promos
/api/admin/users
/api/admin/settings
…
```

Listado completo: explorar `src/app/api/`.
