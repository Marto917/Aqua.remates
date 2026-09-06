# Aqua — Fundamentos e ideas principales

Documento vivo. Se actualiza mientras avanza el trabajo.  
**Última actualización:** 6 sep 2026  
**Dominio:** [www.aquaremates.com.ar](https://www.aquaremates.com.ar)  
**Marca:** Aqua / Aqua.remates

> Este archivo describe *qué es* la app, *por qué* existe y *hacia dónde* puede ir.  
> Handoff técnico para IA: [`AGENTS.md`](./AGENTS.md) + carpeta [`docs/`](./docs/).  
> Checklist histórico: [`BACKLOG.md`](./BACKLOG.md).

---

## 1. Qué es Aqua (en una frase)

Tienda online argentina de **remates / liquidación** con **doble canal de venta** (minorista B2C + mayorista B2B), backoffice de operación (pedidos, envíos, riders) y catálogo propio alimentado en parte desde publicaciones de Mercado Libre.

---

## 2. Ideas fundamentales (no negociables del producto)

### 2.1 Dos modos de compra, un catálogo

| Modo | Para quién | Idea |
|------|------------|------|
| **Minorista** | Comprador final | Compra rápida: carrito → checkout → pago (transferencia o Mercado Pago) → entrega o retiro |
| **Mayorista** | Revendedor / negocio | Precio distinto, solicitud / contacto consultivo, estados internos de seguimiento |

El catálogo es el mismo; cambia **precio, flujo y reglas**.

### 2.2 Remate = confianza + claridad de oferta

En liquidación el comprador desconfía más. La app debe empujar:

- Precio claro (lista, descuento por transferencia, markup MP si aplica)
- Fotos reales y suficientes
- Estado del pedido visible
- Política de envío / retiro / cambios entendible
- Señal de marca fuerte (Aqua.remates), no “otra tienda genérica”

### 2.3 Operación primero, marketing después

El valor del negocio está en **cerrar el pedido de punta a punta**:

1. Catálogo vivo  
2. Checkout que no se rompe  
3. Pago confirmado (MP webhook o comprobante de transferencia)  
4. Armado / packing  
5. Envío o retiro (tickets, QR, riders)  
6. Postventa mínima (cuenta, mails, quejas)

Sin eso, el resto (promos, SEO, import ML) es ruido.

### 2.4 Un stock, muchos espejos (visión)

Hoy el trabajo con Mercado Libre arranca como **import de ficha** (traer título, fotos, barcode).  
La dirección natural del negocio multicanal es:

- **Fuente de verdad = stock Aqua** (o un IMS interno)
- ML / web / local = canales que *espejan* cantidad y estado
- Webhooks + conciliación periódica (no solo sync manual)

Sin stock único, el overselling es cuestión de tiempo (especialmente en Hot Sale / Cyber).

### 2.5 Staff oculto, cliente visible

- Clientes: login/registro en la tienda (credenciales + Google)
- Staff: path de login no publicitado, roles `OWNER` / `EMPLOYEE`
- Riders: app externa con JWT (no DB directa)

---

## 3. Stack y piezas del sistema (mapa mental)

| Capa | Tecnología / pieza |
|------|--------------------|
| App | Next.js 15 (App Router) + React 19 + TypeScript + Tailwind |
| Datos | Prisma + PostgreSQL |
| Auth | NextAuth (credentials + Google OAuth) |
| Pagos | Mercado Pago + transferencia bancaria |
| Email | EnvialoSimple (DonWeb) |
| Media | Uploads locales y/o Cloudinary |
| Anti-bot | Cloudflare Turnstile |
| Hosting | Railway + DNS Donweb |
| Envíos | Tarifas propias, tickets, lookup por API, riders |

---

## 4. Capacidades ya existentes (estado real del código)

Más allá del README (parcialmente desactualizado), el sistema ya cubre bastante:

### Tienda

- Home (hero, banners, cinta, búsqueda, destacados)
- Catálogo + ficha de producto (variantes, precios retail/wholesale)
- Carrito (modos retail / wholesale)
- Checkout minorista (transferencia + Mercado Pago, éxito/pendiente/error)
- Cuenta: registro, verificación email, mis compras, direcciones, pedidos mayorista
- Wishlist, reviews, promociones, códigos promo
- Libro de quejas, contacto, locales

### Backoffice

- Pedidos minoristas (aprobación de transferencias, packing, envíos, tickets)
- Solicitudes y leads mayoristas + aprobaciones
- ABM productos / categorías / banners / promos / settings de marca y envío
- Finanzas (owner), usuarios, riders (feature flag)
- Export de catálogo, barcodes / scanner

### En progreso reciente (working tree, ago 2026)

**Importar 1 artículo de Mercado Libre al alta de producto (admin)**

- `src/lib/meli-item.ts` — parse link/ID MLA, título, descripción, fotos, barcode, precio referencia
- `src/app/api/admin/import-meli` — fetch + descarga/compresión de imágenes
- `AdminProductCreateForm` — UI “Traer de Mercado Libre” (el precio de ML **no** se copia ciego al listPrice)
- `.env.example` — `MELI_ACCESS_TOKEN`

Flujo actual: pegar link → preview → staff completa categoría / proveedor / precio Aqua → crear producto.

---

## 5. Principios de producto (cómo decidir features)

1. **¿Ayuda a vender o a despachar?** Si no, baja prioridad.  
2. **¿Reduce trabajo manual del staff?** (import ML, packing, riders).  
3. **¿Evita overselling / reclamos?** (stock, estados, comprobantes).  
4. **¿Es claro en móvil?** La mayoría compra desde el teléfono.  
5. **¿Encaja en Argentina?** Alias/CBU, MP, envíos CABA/PBA/interior, AFIP cuando toque “en blanco”.

---

## 6. Qué puede faltar (investigación + contraste con Aqua)

Ideas priorizadas por impacto. No son tareas inmediatas; son **gaps** típicos de tiendas como esta y de buenas prácticas 2025–2026.

### 6.1 Catálogo y datos de producto (alto impacto)

Investigación (PIM / product data 2026): el cuello de botella no es “más UI”, sino **datos estructurados y consistentes**.

| Gap | Por qué importa | Nota para Aqua |
|-----|-----------------|----------------|
| Atributos estructurados (peso, medidas, material, condición) | Filtros, envíos, SEO, menos dudas | Hoy hay ficha rica; conviene schema fijo por categoría |
| Identificadores canónicos (SKU + GTIN/barcode) | Multicanal y conciliación | Ya hay barcodes; reforzar SKU único compartido con ML |
| Variantes completas (matriz color/talle, no “ver descripción”) | Menos error de stock y de packing | Parcialmente cubierto |
| Calidad mínima para publicar (N fotos, título, precio, peso) | Evita fichas flojas en remate | Checklist “listo para vender” en admin |
| Enrichment primero en top sellers | 80/20 del revenue | Priorizar los SKUs que más venden |

Fuentes: [Scandiweb — catalog management](https://scandiweb.com/blog/product-catalog-management-tips-strategies/), [Defacto Labs — product data](https://defactolabs.com/blog/product-data-for-ecommerce).

### 6.2 Multicanal Mercado Libre (medio-alto, camino natural del import)

Hoy: **import one-shot** de ficha. Falta (si se vende también en ML):

| Gap | Idea |
|-----|------|
| Stock central único | Aqua descuenta; ML y web espejan |
| Webhooks `orders_v2` (+ cola + HTTP 200 rápido) | Venta en ML → descuenta Aqua → actualiza canales |
| Conciliación periódica (15–60 min) | Los webhooks se pierden; el poll corrige |
| Buffer de seguridad | 1–2 u. en el canal más lento / más traffic |
| OAuth con refresh (tokens ML expiran) | `MELI_ACCESS_TOKEN` estático no escala |
| Pausar / reactivar por stock 0 | Evita overselling y penalizaciones ML |
| Mapa SKU Aqua ↔ item_id ML | Sin esto, el sync es frágil |

Fuentes: [Deepyze — sync ML](https://deepyze.dev/blog/automatizacion-ecommerce-mercadolibre/), [DP Estudio — sync AR](https://dptiendaonline.com/blog/articulos/sincronizar-stock-mercadolibre-tienda-propia), [docs notificaciones ML](https://developers.mercadolibre.com.ni/en_us/list-vehicles/products-receive-notifications).

### 6.3 Mayorista B2B (medio)

Aqua ya tiene precio wholesale + solicitud. Lo que suele faltar en B2B maduro:

| Gap | Idea |
|-----|------|
| Listas de precio por cliente / segmento | No todos los mayoristas pagan lo mismo |
| MOQ / múltiplos (cajas) | Protege margen y alinea packing |
| Descuentos por volumen (escalas) | Incentiva ticket más alto |
| Acceso gated a precios mayoristas | El público no ve el descuento B2B |
| Reordenar desde historial / pedido rápido | Menos fricción para clientes repetidores |
| Términos de pago (cuenta corriente / Net N) | Cuando el negocio lo pida |

Fuentes: [Shopify — B2B features checklist](https://www.shopify.com/enterprise/blog/b2b-ecommerce-features-wholesale), [Nevuto — B2B 2026](https://www.nevuto.com/blog/b2b-ecommerce-solutions-practical-guide-2026).

### 6.4 Confianza y postventa (alto en remates)

| Gap | Idea |
|-----|------|
| Política de cambios/devoluciones visible | En liquidación, “as-is” debe decirse sin letra chica |
| Tracking claro + mail de despacho | Expectativa #1 del comprador online |
| Reviews verificadas (solo compra entregada) | Ya hay reviews; reforzar elegibilidad y visibilidad |
| FAQ en ficha (envío, condición, garantía) | Reduce WhatsApp y abandonos |
| Transparencia de condición del ítem | Nuevo / abierto / reacondicionado |

### 6.5 Operación, compliance y calidad (del backlog + investigación)

Ya listado en `BACKLOG.md`, sigue siendo estratégico:

- Infra estable en hosting (DB, secrets, health)
- Verificación de email en checkout (producción)
- ABM productos estable + imágenes
- SEO básico (títulos, OG)
- Tests críticos / checklist manual
- Logs y alertas 5xx
- Backups de Postgres
- **AFIP** facturación electrónica cuando el negocio opere “en blanco”

### 6.6 Experiencia de marca / conversión

- Home como **una composición** de marca (no dashboard)
- Hero fuerte de Aqua.remates + una promesa + un CTA
- Menos clutter (chips, stats, cards decorativas)
- Móvil primero; contraste y foco accesibles

---

## 7. Norte corto (próximos hitos conceptuales)

Orden sugerido de *ideas*, alineado al backlog:

1. **Tienda cerrable de punta a punta** (catálogo → pago → packing → entrega)  
2. **Import ML sólido** (lo que se está construyendo ahora) + disciplina de SKU/barcode  
3. **Mayorista usable** (solicitud + estados + panel)  
4. **Confianza** (políticas, tracking, reviews)  
5. **Sync stock ML** solo cuando el volumen lo justifique  
6. **AFIP / blanco** cuando el contador lo defina  

---

## 8. Cómo se actualiza este documento

Mientras se trabaja en Aqua, este `.md` debería reflejar:

- Features nuevas o en curso (sección 4)
- Cambios de decisión de producto (sección 2)
- Gaps que se cierran o se agregan (sección 6)
- Fecha de “Última actualización” arriba

No reemplaza `BACKLOG.md` (tareas) ni el código (fuente de verdad técnica).

---

## 9. Referencias rápidas del repo

| Archivo | Para qué |
|---------|----------|
| `AGENTS.md` | Entrada obligatoria para IAs / otra PC |
| `docs/HANDOFF.md` | Estado actual y pendientes |
| `docs/CONTEXTO-APP.md` | Stack, auth, deploy, estructura |
| `docs/MODULOS.md` | Módulos, rutas, APIs |
| `docs/GOTCHAS.md` | Errores típicos a evitar |
| `BACKLOG.md` | Checklist histórico (verificar vs código) |
| `README.md` | Overview antiguo (puede ir desfasado) |
| `.env.example` | Features opcionales e integraciones |
| `riders_app_brief_para_ia.txt` | Contrato app repartidores |
| `mercadopago_tutorial.txt` / `google_auth_tutorial.txt` / `envios_tutorial.txt` | Setup de integraciones |

---

*Documento de fundamentos — Aqua / Aqua.remates.*
