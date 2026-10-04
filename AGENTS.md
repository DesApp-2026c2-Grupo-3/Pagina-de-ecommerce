# AGENTS.md — Pagina-de-ecommerce

Plataforma de delivery de comida rápida. Tres apps + docs, sin workspaces/npm workspaces: cada carpeta tiene su propio `package.json` y `node_modules`.

## Estructura

- `Backend/` — API Express 5, CommonJS, Sequelize 6. Entrypoint: `src/main.js`.
- `Frontend/` — app cliente: React 19 + Vite + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`).
- `admin/` — panel admin: React 19 + Vite + TS + Tailwind v4 (mismo stack, repo aparte de carpetas).
- `doc/` — requisitos. `enunciado.md` es la fuente de verdad; `analisis-requerimientos.md` es borrador, no definitivo.
- `.agents.md` — contexto de negocio y reglas (estados de pedido, roles, asignación de sucursal). Leer antes de tocar lógica de pedidos.

## Comandos (por carpeta, no hay root scripts)

| Carpeta | Dev | Test | Lint | Build |
|---|---|---|---|---|
| `Backend` | `npm run dev` (nodemon `src/main.js`) | `npm test` / `npm run test:coverage` (jest) | — | — |
| `Frontend` | `npm run dev` | — (sin tests) | `npm run lint` (oxlint) | `npm run build` (`tsc -b && vite build`) |
| `admin` | `npm run dev` | — | `npm run lint` | `npm run build` |

Jest config está embebido en `Backend/package.json`; ignora `main.js`, migrations, seeders, config, models, routes.

## Base de datos / Sequelize

- Postgres. En desarrollo se usa `DATABASE_URL` de `Backend/.env`; `src/main.js` corre `sequelize.sync({ force: false })` al arrancar (no hace falta migrar para levantar, pero las migraciones existen).
- Migrations/seeders: sequelize-cli con `.sequelizerc` → paths en `src/migrations`, `src/seeders`, `src/config/config.json`. Ejecutar desde `Backend/`.
- Ojo: `config.json` sección `test` tiene `username: root, password: root, database: database_test` con dialect postgres — parece heredado de MySQL y probablemente haya que corregirlo si se corren tests contra DB real.
- Seeds clave: admin master (`20260921154858-admin-master.js`), sucursales, categorías, productos, insumos/recetas/stock.

## Env vars

- `Backend/.env`: `DATABASE_URL`, `PORT` (default 3000).
- `Frontend/.env`: `VITE_API_URL` (ej. `http://localhost:3000`) y `VITE_GOOGLE_MAPS_API_KEY` (requerida por `AddressPicker.tsx` y `SucursalesMap.tsx`; sin ella el front muestra aviso).
- `admin/` **no** usa env vars: `admin/src/services/auth.ts` y demás services hardcodean `http://localhost:3000/admin`. Si cambia el puerto del backend, hay que editar los services a mano.

## Convenciones y gotchas

- Carrito y sesión del cliente viven en `localStorage` (`CartContext`, `AuthContext`); el carrito se envía completo al crear el pedido. No hay React Router navegación con estado de servidor — todo es fetch contra la API (`Frontend/src/services/httpClient.ts`).
- El backend **no implementa JWT** todavía (no hay `jsonwebtoken` ni middleware de auth en `src/middleware`), aunque `.agents.md` lo describe como regla de negocio. Admin guarda el objeto en `localStorage` (`admin` key `administrador`) sin token que se envíe al backend.
- Endpoints públicos: `/productos`, `/usuario`, `/pedido`, `/direcciones`, `/sucursales`, `/geo` (proxy a Google Places: autocompletar, detalle, reverse). Admin bajo `/admin/*`.
- Asignación de sucursal al pedido: más cercana, activa y con stock; fallback a elección del cliente. Lógica en `pedidoController` — revisar antes de modificar.
- Errores de API en español (`mensaje`, `code`); el `httpClient` los propaga como `Error.message`.
- Precios con `toLocaleString('es-AR')`. Paleta/estilos definidos en `Frontend/src/index.css` vía `@theme` de Tailwind v4 — usar tokens `brand-*`, no colores nuevos.

## Verificación recomendada

- Cambios en Backend: `npm test` en `Backend/` (requiere Postgres local para tests de integración).
- Cambios en Frontend/admin: `npm run lint` y `npm run build` en la carpeta correspondiente (el build corre `tsc -b`, así que también typecheck).
