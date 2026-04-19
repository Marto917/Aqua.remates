# Aqua — backlog ordenado (ir de arriba hacia abajo)

Marcá cada ítem cuando quede cerrado. El orden prioriza **que la tienda funcione de punta a punta** y después el pulido.

## 1. Infra y credenciales (bloqueante)

1. [ ] **Variables en el hosting (Vercel u otro):** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (URL pública exacta, `https://…`).
2. [ ] **Comprobar deploy:** abrir `/api/health` y verificar `ok: true` (DB alcanzable y secret presente).
3. [ ] **Poblar datos demo** en la misma base que usa el deploy: `npm run db:seed` local con `DATABASE_URL` de Neon **o** `/setup-demo` en producción (con `SETUP_SECRET` definido).
4. [ ] **Probar login** `owner@aqua.local` / `Owner1234` y acceso a `/admin`.

## 2. Catálogo y carrito

5. [ ] Revisar **catálogo** y **ficha de producto** (variantes, precios minorista/mayorista).
6. [ ] **Carrito** persistente y barra móvil sin regresiones.
7. [ ] **Checkout retail:** flujo completo (datos, transferencia, creación de `RetailOrder` si aún falta cableado).

## 3. Mayorista y pedidos

8. [ ] **Solicitud mayorista** desde carrito → persistencia `WholesaleRequest` + estados.
9. [ ] **Panel empleado:** lista y gestión de solicitudes (nuevo → contactado → …).

## 4. Cuenta y email

10. [ ] **Registro + verificación de email** (enlace real con Resend/SMTP en producción).
11. [ ] Middleware de **email verificado** en checkout para clientes.

## 5. Admin y contenido

12. [ ] **ABM productos** estable (imágenes, variantes, activar/desactivar).
13. [ ] **Banners / home** alimentados desde DB si aplica.
14. [ ] **Finanzas (owner):** lo definido en negocio (export, filtros).

## 6. Pulido UX / marca

15. [ ] Home y componentes alineados a la referencia visual acordada (hero, categorías, footer).
16. [ ] **SEO** básico (títulos, meta, Open Graph si hace falta).
17. [ ] Revisión **móvil** y accesibilidad mínima (contraste, foco).

## 7. Calidad y operación

18. [ ] **Tests** críticos (auth, pricing, carrito) o checklist manual documentado.
19. [ ] **Logs y alertas** en producción (errores 5xx, fallos de pago/DB).
20. [ ] **Backups** de base (Neon/ proveedor) y plan de restauración.

## 8. Fiscalidad Argentina (“en blanco”) — aparte, requisitos de negocio

21. [ ] Definir con el contador: **facturación electrónica AFIP** (WSFE/WSAA o proveedor fiscal), CUIT, punto de venta, certificados.
22. [ ] Integración técnica (homologación → producción) y mapeo **pedido → comprobante**.

---

*Última actualización: checklist vivo para el proyecto Aqua.*
