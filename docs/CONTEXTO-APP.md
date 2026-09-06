# Contexto de la app — Aqua Remates

**Última actualización:** 6 sep 2026  
**Producción:** https://www.aquaremates.com.ar

---

## 1. Qué es

Tienda online argentina de **remates / liquidación** con:

- **Minorista (B2C):** catálogo → carrito → checkout → transferencia o Mercado Pago → packing / envío / retiro  
- **Mayorista (B2B):** precios wholesale, solicitud/checkout consultivo, leads  
- **Backoffice staff:** catálogo, pedidos, envíos, promos, configuración  
- **Vendedor:** operación de armado y despacho  
- **Riders (opcional):** app externa con JWT  

Un mismo catálogo; cambian precio, flujo y reglas según el canal.

---

## 2. Stack

| Capa | Tecnología |
|------|------------|
| App | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind 3 |
| DB | Prisma 6 + PostgreSQL |
| Auth | NextAuth v4 (credentials + Google OAuth) |
| Pagos | Mercado Pago SDK + transferencia (CBU/alias en settings) |
| Email | EnvialoSimple (DonWeb) |
| Media | `public/uploads/products` y/o Cloudinary |
| Anti-bot | Cloudflare Turnstile |
| Barcodes | `@zxing/browser` |
| Hosting | Railway (`railway.toml`) + DNS Donweb |

Versión app: `package.json` → `"version": "1.1.0"`, nombre `"aqua"`.

---

## 3. Estructura del repo

```
Aqua/
├── AGENTS.md                 # Entrada IA
├── FUNDAMENTOS.md            # Visión producto
├── BACKLOG.md                # Checklist histórico
├── docs/                     # Este handoff
├── prisma/                   # schema + migrations + seed
├── scripts/import-catalog.ts # Reimport JSON exportado
├── public/uploads/products/  # Imágenes (volume Railway)
├── middleware.ts             # apex→www, auth staff, checkout
├── railway.toml
└── src/
    ├── app/
    │   ├── (tienda)/         # UI cliente
    │   ├── (staff)/          # admin + vendedor + login oculto
    │   └── api/              # Route handlers
    ├── components/           # admin, home, shipping, barcode…
    ├── lib/                  # Dominio (auth, pricing, meli, shipping…)
    ├── contexts/ hooks/ types/
    └── instrumentation.ts
```

### Route groups

| Grupo | Layout | Contenido típico |
|-------|--------|------------------|
| `(tienda)` | Nav tienda + footer | `/`, `/catalog`, `/product/[slug]`, `/carrito`, `/checkout`, `/mayorista`, `/cuenta`, `/promociones`, `/login`, `/registro` |
| `(staff)` | Shell staff | `/admin/*`, `/vendedor/*`, login oculto |

**Login staff:** carpeta bajo `(staff)/` alineada a `STAFF_LOGIN_PATH` (ej. `login-aquaremates_administracion`). No usar `/login` de clientes.

**Aliases admin:** preferir `/admin/productos` y `/admin/finanzas` (existen también `/admin/products`, `/admin/finance`).

---

## 4. Auth y roles

```text
UserRole: OWNER | EMPLOYEE | CUSTOMER
StaffAccessLevel: MANAGER | SELLER
```

| Quién | Acceso |
|-------|--------|
| CUSTOMER | Tienda; Google OK; email verificado para checkout |
| EMPLOYEE | `/admin` + `/vendedor`; login solo path oculto |
| OWNER | Todo lo de employee + finanzas, riders admin, aprobaciones |
| EMPLOYEE + MANAGER | También `/admin/usuarios` |
| EMPLOYEE + SELLER | Operación; sin gestión de usuarios |

- Staff **no** entra con Google.  
- Sesión cliente: **30 días**. Sesión staff: **12 horas** (`src/lib/auth.ts`).  
- Cookie de dominio en prod: `.aquaremates.com.ar`.  
- `BACKOFFICE_PREVIEW`: solo desarrollo local; en production siempre off.

Riders: JWT propio (`RIDER_JWT_SECRET` o fallback `NEXTAUTH_SECRET`), no NextAuth.

Archivos clave: `src/lib/auth.ts`, `src/lib/staff-auth.ts`, `middleware.ts`.

---

## 5. Datos (Prisma) — modelos centrales

| Área | Modelos |
|------|---------|
| Catálogo | `Product`, `ProductVariant`, `ProductVariantImage`, `ProductBarcode`, `Category` |
| Visibilidad | `CatalogVisibility` (`PUBLIC_BOTH`, `WHOLESALE_ONLY`, `HIDDEN`) |
| Carrito | `Cart` + `PriceModeCart` (`RETAIL` / `WHOLESALE`) |
| Minorista | `RetailOrder`, ítems, estados de pago/envío |
| Mayorista | `WholesaleRequest`, `WholesaleLead`, aprobaciones |
| Contenido | `Banner`, `StorePromo`, `StoreSettings` (hero, cinta, tarifas, promos catálogo) |
| Promos | `PromoCode` |
| Staff / riders | `User`, `Rider` |
| Reviews / wishlist | `ProductReview`, `WishlistItem` |

Schema: `prisma/schema.prisma`.

---

## 6. Deploy (Railway)

- Build: `npm run build` (`prisma generate && next build`)  
- Start: `npm run db:migrate && npm run start`  
- Health: `GET /api/health`  
- Volume recomendado: montar en `public/uploads/products`  
- Dominios: apex + www; middleware **308** apex → www  
- `NEXTAUTH_URL` / `PUBLIC_APP_URL`: `https://www.aquaremates.com.ar`  

Detalle DNS: `dominio_aquaremates_donweb.txt`.

---

## 7. Scripts npm útiles

| Script | Uso |
|--------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` / `start` | Producción |
| `npm run db:migrate` | Migraciones deploy |
| `npm run prisma:migrate` | Migraciones en dev |
| `npm run db:seed` | Seed demo |
| `npm run import:catalog` | Importar `catalog-aqua.json` exportado |
| `npm run lint` | ESLint |

---

## 8. Variables de entorno (resumen)

Ver lista completa y comentarios en `.env.example`.

Críticas: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `PUBLIC_APP_URL`, `MERCADOPAGO_*`, `MELI_ACCESS_TOKEN` (import ML), `SHIPPING_LOOKUP_KEY`, `ENVIALOSIMPLE_*`, Turnstile, Cloudinary opcional, `STAFF_LOGIN_PATH`, `DEFAULT_OWNER_*`.
