# Handoff — dónde quedamos

**Fecha de este handoff:** 6 sep 2026  
**Repo:** Aqua (Desktop / Railway → www.aquaremates.com.ar)  
**Usuario / owner del proyecto:** Martín (Aqua Remates)

Usá este archivo al abrir el chat en otra PC. Actualizalo cuando cierres un bloque grande de trabajo.

---

## Estado general

La tienda está en **producción** con catálogo grande (~500+ artículos), doble canal, pagos MP + transferencia, staff admin/vendedor, packing con barcodes.

`README.md` de la raíz está **desactualizado** (casi no menciona MP, Google, riders, import ML). Preferir este handoff + `FUNDAMENTOS.md` + código.

---

## Trabajo reciente (hecho en sesiones previas)

### Seguridad / auth staff
- Auth en settings admin, shipping lookup fail-closed (`SHIPPING_LOOKUP_KEY`)
- Solo OWNER crea/edita OWNER/MANAGER
- `NEXTAUTH_SECRET` validado
- Middleware login staff sin loops
- Sesiones: **12 h staff**, **30 días clientes**

### Catálogo admin
- Filtros y buscador: `AdminCatalogFilters` (q, categoría, activo, visibilidad, proveedor, incompletos)
- Multi barcodes (`ProductBarcode` + editor + packing)
- Export CSV POS + Export ZIP con **streaming** y **barra de progreso**
- Import **1 link** Mercado Libre → precarga ficha (falta token en Railway si aún no está)

### UX / bugs corregidos
- Clics muertos admin (backdrop mobile)
- Redirect `localhost:8080` al guardar → `app-url.ts`
- Cámara packing: `Permissions-Policy: camera=(self)` + scanner
- Catálogo mobile: acciones Editar visibles
- Promos/hero/carrusel: `object-contain` + proporciones alineadas (no “fotos cortadas”)

### Aviso Railway (otro proyecto posible)
- Mail de patch Postgres en proyecto **patient-motivation** (no confundir con Aqua salvo que sea el mismo workspace). Es mantenimiento programado, no error de la app.

---

## Pendiente / atención operativa

1. **`MELI_ACCESS_TOKEN` en Railway** — sin esto el botón “Traer de Mercado Libre” falla. Crear app en developers.mercadolibre.com y pegar access token. Los tokens **expiran**; hay que renovarlos.
2. **Probar Export ZIP en prod** con catálogo grande (progreso visible + descarga).
3. **Confirmar volume** de imágenes en Railway (`public/uploads/products`) o Cloudinary.
4. Visión futura (no implementar sin pedido): sync stock ML, AFIP, listas B2B — ver `FUNDAMENTOS.md` §6.
5. `BACKLOG.md` tiene ítems viejos; varios ya están hechos en código — no seguirlo ciegamente.

---

## Cómo retomar en otra PC

```bash
git clone <repo>   # o copiar carpeta Aqua
cd Aqua
npm install
cp .env.example .env   # completar secrets (NUNCA subir .env)
npx prisma migrate dev # o db:migrate si apuntás a DB remota
npm run dev
```

Leer en orden: `AGENTS.md` → este `HANDOFF.md` → `docs/CONTEXTO-APP.md` → `docs/GOTCHAS.md`.

---

## Conversaciones / planes útiles

- Plan import ML: `.cursor/plans/importar_desde_mercado_libre_*.plan.md` (si existe en la máquina Cursor)
- Transcripts Cursor: carpeta agent-transcripts del proyecto (local a cada PC)

---

## Convenciones al seguir trabajando

- Español con el usuario  
- Cambios acotados; no refactors masivos no pedidos  
- No commit/push sin pedido  
- Actualizar **este archivo** al terminar un feature grande  

---

*Handoff vivo — editar la fecha y las secciones “hecho / pendiente” cuando cambie el estado.*
