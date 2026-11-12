# AGENTS.md — Pagina-de-ecommerce

Plataforma de delivery de comida rápida. Cuatro apps + docs, sin workspaces/npm workspaces: cada carpeta tiene su propio `package.json` y `node_modules`.

## Estructura

- `Backend/` — API Express 5, CommonJS, Sequelize 6. Entrypoint: `src/main.js`.
- `Frontend/` — app cliente: React 19 + Vite + TypeScript + Tailwind CSS v4 (`@tailwindcss/vite`).
- `admin/` — panel admin: React 19 + Vite + TS + Tailwind v4 (mismo stack, repo aparte de carpetas).
- `repartidor/` — app del repartidor: React + Vite + TS + Tailwind v4 (`npm run dev` en el puerto 5175, que el CORS del Backend ya permite). Usa las rutas `/repartidor/...` del Backend.
- `doc/` — requisitos y permisos. `enunciado.md` es la fuente de verdad; `analisis-requerimientos.md` es borrador, no definitivo; `roles-y-permisos.md` describe la matriz de roles.
- `.agents.md` — contexto de negocio y reglas (estados de pedido, roles, asignación de sucursal). Leer antes de tocar lógica de pedidos.

## Comandos (por carpeta, no hay root scripts)

| Carpeta | Dev | Test | Lint | Build |
|---|---|---|---|---|
| `Backend` | `npm run dev` (nodemon `src/main.js`) | `npm test` / `npm run test:coverage` (jest) | — | — |
| `Frontend` | `npm run dev` | `npm test` | `npm run lint` (oxlint) | `npm run build` (`tsc -b && vite build`) |
| `admin` | `npm run dev` | — | `npm run lint` | `npm run build` |

Jest config está embebido en `Backend/package.json`; ignora `main.js`, migrations, seeders, config, models, routes.

## Base de datos / Sequelize

- Postgres. En desarrollo se usa `DATABASE_URL` de `Backend/.env`. El esquema se crea solo con migraciones: `src/main.js` no hace `sync`.
- Migrations/seeders: sequelize-cli con `.sequelizerc` → paths en `src/migrations`, `src/seeders`, `src/config/config.json`. Ejecutar desde `Backend/`. Orden: `db:migrate` y después `db:seed:all`.
- `20261025120000-esquema-inicial.js` consolida el esquema; las migraciones anteriores están en `src/migrations/_historico` y no se ejecutan. Todo cambio de columnas va en una migración nueva (con `describeTable` para que sea idempotente). Un `migration:generate` vacío se registra como aplicado y no hace nada: completalo antes de migrar.
- `config.json` sección `test` tiene `username: root, password: root, database: database_test` con dialect postgres — parece heredado de MySQL y probablemente haya que corregirlo si se corren tests contra DB real.
- Migraciones `20261108120000-agregar-repartidores-y-viajes` (Repartidors, Viajes y `Pedidos.viajeId`), `20261108130000-convertir-horario-a-turnos` y `20261109120000-horario-con-transnoche` (llevan los horarios guardados al formato actual): el esquema inicial se editó para incluir lo del reparto, pero eso no alcanza a las bases que ya lo habían aplicado. Son idempotentes.
- Horario de sucursal: `{ lunes: { abierto, apertura, cierre, transnocheMin? } }`, horas de 00:00 a 23:59 (23:59 cuenta como las 24:00). El botón "Atención Trasnoche" fija el cierre a las 23:59 y suma `transnocheMin` minutos después de medianoche, con tope `min(apertura del día siguiente − 1 h, 06:00)`; se muestra como `+hh:mm`. Las reglas viven en `Backend/src/utils/horarioSucursal.js` (el panel y la app de clientes tienen su copia para mostrarlo).
- Reparto: tablas `Repartidors` y `Viajes`; los pedidos pasan por "Listo para retirar" antes de "En camino". Admin y encargado manejan repartidores y viajes (el encargado solo los de su sucursal); el repartidor entra por su propia app.
- Seeds: `20261020000000-catalogo-definitivo` (sucursales, categorías, productos, insumos, recetas, stock y el master), `ventas-demo` (40 clientes y pedidos) y `20261107140000-personal-demo` (2 encargados y 2 empleados por sucursal, contraseña `Burger1234`). Los de `seeders/historico` no corren.

## Env vars

- `Backend/.env`: `DATABASE_URL`, `SECRET_JWT_TOKEN` (firma la cookie de sesión del panel), `PORT` (default 3000).
- `Frontend/.env`: `VITE_API_URL` (ej. `http://localhost:3000`) y `VITE_GOOGLE_MAPS_API_KEY` (requerida por `AddressPicker.tsx` y `SucursalesMap.tsx`; sin ella el front muestra aviso).
- `admin/`: usa `VITE_API_URL`.

## Roles del panel de administración

- Tres roles: `MASTER` (dueño, sin sucursal), `ADMIN` (= encargado de una sucursal) y `EMPLEADO` (gestiona los pedidos de su sucursal). El master crea encargados y el encargado crea empleados. Matriz completa en `doc/roles-y-permisos.md`.
- Sesión del panel: cookie httpOnly `access_token` (JWT firmado con `SECRET_JWT_TOKEN`). Middlewares en `src/middleware/admin/`: `esMasterJwt`, `esAdminJwt` (master o encargado), `esPersonalJwt` (los tres), `esEmpleadoJwt` y `deSuSucursalJwt` (limita al encargado a su sucursal). Los roles están en `src/config/roles.js`.
- Reglas fijas: 2 encargados activos por sucursal; empleados hasta el cupo `Sucursal.maxEmpleados` (solo lo edita el master); el personal usa mail `@burgerfast.com`, reservado (`src/utils/emailPersonal.js`), que un cliente no puede usar.
- Horario de sucursal: lo edita el master; el encargado solo si `Sucursal.encargadoEditaHorario` está encendida (perilla en la pantalla Sucursales, `PATCH /admin/sucursales/permiso-horario/:id`; el encargado guarda con `PATCH /admin/sucursales/horario/:id`). Editar el resto de los datos de la sucursal es solo del master.
- Cierre temporal de sucursal: tabla `CierresSucursales` (activo mientras `reabiertoEn` sea null), endpoints en `/admin/cierres`. `crearPedido` lo rechaza con 409 y `GET /sucursales` expone `cierreTemporal`. Cierra solo el encargado de esa sucursal; reabre el encargado o el master.
- Partes y avisos: tablas `Partes` y `Notificaciones`, endpoints en `/admin/partes`, `/admin/notificaciones` y `/admin/perfil`. El panel consulta las notificaciones cada 30 s (no hay websockets). `utils/notificaciones.js` (`notificar`) crea avisos para varios administradores.
- Suspensiones: tabla `SuspensionProductos` (`origen` ENCARGADO o MASTER; activa mientras `rehabilitadaEn` sea null). Endpoints en `/admin/suspensiones`. El encargado levanta solo las suyas; el master levanta cualquiera, también las del encargado. La disponibilidad (`utils/disponibilidad.js` + `utils/suspensiones.js`) la aplican el catálogo, `repetirPedido` y `crearPedido`.
- Solo el empleado cambia el estado de un pedido; master y encargado lo ven en solo lectura.
- `middleware/autenticacion.js` y `utils/jwt.js` (esquema Bearer con `JWT_SECRET`) no se usan.

## Convenciones y gotchas

- Carrito y sesión del cliente viven en `localStorage` (`CartContext`, `AuthContext`); el carrito se envía completo al crear el pedido. Todo es fetch contra la API (`Frontend/src/services/httpClient.ts`).
- Las rutas de cliente (`/pedido`, `/usuario`, `/direcciones`) **no exigen sesión**: el `usuarioId` llega en el body. Es la brecha de seguridad conocida del proyecto.
- Endpoints públicos: `/productos`, `/usuario`, `/pedido`, `/direcciones`, `/sucursales`, `/geo` (proxy a Google Places: autocompletar, detalle, reverse). Admin bajo `/admin/*`.
- Asignación de sucursal al pedido: más cercana, activa y con stock; fallback a elección del cliente. Lógica en `pedidoController` — revisar antes de modificar.
- Errores de API en español (`mensaje`, `code`); el `httpClient` los propaga como `Error.message`.
- Precios con `toLocaleString('es-AR')`. Paleta/estilos definidos en `Frontend/src/index.css` vía `@theme` de Tailwind v4 — usar tokens `brand-*`, no colores nuevos.

## Verificación recomendada

- Cambios en Backend: `npm test` en `Backend/` (requiere Postgres local para tests de integración).
- Cambios en Frontend/admin: `npm run lint` y `npm run build` en la carpeta correspondiente (el build corre `tsc -b`, así que también typecheck).
