# Pagina-de-ecommerce

Plataforma de pedidos de BurgerFast, una casa de comidas rápidas con varias sucursales. Tres apps:

- `Backend/` — API (Express, Sequelize, PostgreSQL).
- `Frontend/` — app de los clientes (React + Vite).
- `admin/` — panel de administración (React + Vite).

## Puesta en marcha

Desde `Backend/`, con `DATABASE_URL` y `SECRET_JWT_TOKEN` en el `.env`:

```bash
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```

Para empezar de cero: `db:drop`, `db:create`, y de nuevo migrar y sembrar.

## Credenciales de demo

| Rol | Email | Contraseña |
|---|---|---|
| Master (dueño) | `admin@master.com` | Admin1234 |
| Encargado (2 por sucursal) | `lucia.fernandez@burgerfast.com` (Hurlingham) | `Burger1234` |
| Empleado (2 por sucursal) | `camila.romero@burgerfast.com` (Hurlingham) | `Burger1234` |
| Cliente (40 de demo) | `demo01@demo.burgerfast` a `demo40@demo.burgerfast` | `demo1234` |

Todo el personal usa `nombre.apellido@burgerfast.com` y la misma contraseña de demo. La lista completa está en `Backend/src/seeders/20261028130000-personal-demo.js`.

## Roles del panel

Master (dueño), encargado de sucursal y empleado. Qué puede hacer cada uno: [`doc/roles-y-permisos.md`](doc/roles-y-permisos.md).
