# AGENTS.md — Aqua / Aqua Remates

Punto de entrada para cualquier IA (Cursor u otra) que retome este repo en otra máquina.

**Dominio producción:** https://www.aquaremates.com.ar  
**Marca:** Aqua / Aqua.remates  
**Idioma con el usuario:** español.

## Leer primero (en este orden)

1. [`docs/HANDOFF.md`](docs/HANDOFF.md) — dónde quedó el trabajo y qué está pendiente  
2. [`docs/CONTEXTO-APP.md`](docs/CONTEXTO-APP.md) — qué es el producto, stack, estructura  
3. [`docs/MODULOS.md`](docs/MODULOS.md) — módulos, rutas y APIs  
4. [`docs/GOTCHAS.md`](docs/GOTCHAS.md) — errores típicos a no repetir  
5. [`FUNDAMENTOS.md`](FUNDAMENTOS.md) — visión de producto y gaps estratégicos  
6. [`BACKLOG.md`](BACKLOG.md) — checklist histórico (puede estar desfasado vs código)  
7. [`.env.example`](.env.example) — variables reales de integración  

**Fuente de verdad técnica:** el código. Los `.md` orientan; si hay conflicto, gana el código + `prisma/schema.prisma`.

## Reglas rápidas para la IA

- Responder al usuario en **español**.
- No inventar features: contrastar con `src/` y Prisma.
- No commitear ni pushear salvo pedido explícito.
- Staff login: path oculto (`STAFF_LOGIN_PATH`), no el `/login` de clientes.
- Redirects de admin: usar `src/lib/app-url.ts` (nunca host interno de Railway).
- Uploads: volume en `public/uploads/products` o Cloudinary.
- Import ML: requiere `MELI_ACCESS_TOKEN` en Railway.

## Arranque local

```bash
npm install
# configurar .env a partir de .env.example
npx prisma migrate dev
npm run dev
```

Producción (Railway): `npm run build` → start con `db:migrate && start` (ver `railway.toml`).
