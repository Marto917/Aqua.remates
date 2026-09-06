# Gotchas — no repetir estos errores

Lista corta para IAs y humanos. Si algo “misterioso” falla, mirá acá primero.

---

## Redirects y URLs

- **Nunca** usar `req.url` / host interno de Railway para redirects post-guardar. Sale `localhost:8080` o URL privada.
- Usar siempre `resolveAppOrigin`, `appPathUrl`, `redirectToApp` en `src/lib/app-url.ts`.
- Apex `aquaremates.com.ar` → **www** (308 en middleware). Cookies/OAuth en www.

## Auth / staff

- Clientes: `/login`. Staff: path **oculto** = `STAFF_LOGIN_PATH` = nombre de carpeta en `(staff)/`.
- Staff no puede Google OAuth.
- `BACKOFFICE_PREVIEW=true` **solo local**; en production se ignora.
- Sesión staff corta (12 h): si “no autorizado” de golpe, puede ser TTL.

## Cámara / barcodes

- `next.config.ts` debe tener `Permissions-Policy` con `camera=(self)`. Si está `camera=()`, el scanner no abre.
- En `BarcodeCameraScanner`, el `<video>` tiene que estar montado/visible **antes** de `getUserMedia` (doble rAF).
- Requiere HTTPS (o localhost) y permiso del navegador.

## Imágenes / uploads

- En Railway sin volume, el disco puede ser efímero → preferir volume en `public/uploads/products` o `STORAGE=cloudinary`.
- `saveCompressedProductImage`: productos ~1600px; banners/hero pueden pedir `maxSide: 1920`.
- Hero/carrusel: usar **object-contain** y la proporción documentada; `object-cover` “corta” el diseño.

## Mercado Libre

- Import necesita `MELI_ACCESS_TOKEN`. Sin token → error claro `missing_token`.
- Token OAuth **vence**; 403/forbidden → renovar en Railway.
- No scrapear HTML de ML; usar API oficial (`lib/meli-item.ts`).
- Precio ML = referencia; no autocompletar `listPrice` sin confirmación del vendedor.

## Export ZIP

- Streaming sin `Content-Length`; el cliente lee el body por chunks (`ExportCatalogButton`).
- `maxDuration` alto (300) en la route; igual Railway puede cortar exports enormes.
- Límite de imágenes **remotas** (CDN): 80. Las locales del volume van todas.
- No es dump de Postgres: es catálogo JSON + fotos. Pedidos/usuarios no van en el ZIP.
- CSV POS: separador `;`, BOM UTF-8, una fila por código de barra.

## Admin UI

- Backdrop de nav mobile no debe tapear desktop (clics muertos).
- Listado productos: con ~500 ítems **siempre** usar filtros; no asumir que scrollear alcanza.
- Preferir `/admin/productos` (español).

## Pagos / envíos

- MP: sandbox vs producción (`MERCADOPAGO_SANDBOX`).
- Lookup de envíos: sin `SHIPPING_LOOKUP_KEY` → fail closed (503), no “abierto”.
- Webhooks MP: URL pública HTTPS correcta.

## Prisma / deploy

- Start Railway corre `prisma migrate deploy`.
- Health `/api/health` valida DB + secret.
- No editar migraciones ya aplicadas en prod; crear migración nueva.

## Docs

- `README.md` raíz desactualizado.
- `BACKLOG.md` puede listar cosas ya hechas.
- Confiar en `docs/HANDOFF.md` + código.
