
# BurgerFast — Plataforma de delivery de comida rápida

Trabajo práctico de **Desarrollo de Aplicaciones (2026, 2.º cuatrimestre) — Grupo 3**.

BurgerFast es una cadena de hamburgueserías con varias sucursales. El sistema cubre todo el
recorrido de un pedido: se arma la carta (productos, combos, recetas y stock), el cliente pide
desde la web, la sucursal lo prepara y un repartidor lo entrega. Todo se ve en tiempo real.

El proyecto tiene **cuatro aplicaciones** que comparten una misma base de datos:

| Carpeta | Qué es | Para quién |
|---|---|---|
| [`Backend/`](Backend) | API REST + WebSockets | Todas las apps |
| [`Frontend/`](Frontend) | Tienda web | Clientes |
| [`admin/`](admin) | Panel de administración | Administradores (master y de sucursal) |
| [`repartidor/`](repartidor) | App de reparto (pensada para el celular) | Repartidores |

```
          ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
          │   Frontend   │   │    admin     │   │  repartidor  │
          │   (tienda)   │   │   (panel)    │   │   (reparto)  │
          └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
                 │   HTTP (REST) + Socket.IO (tiempo real)
                 └──────────────────┼──────────────────┘
                             ┌──────┴───────┐
                             │   Backend    │──── Cloudinary (imágenes)
                             │  Express 5   │──── Google Maps / Places
                             └──────┬───────┘──── Gmail (recuperar contraseña)
                                    │
                             ┌──────┴───────┐
                             │  PostgreSQL  │
                             └──────────────┘
```

---

## Índice

1. [Tecnologías](#tecnologías)
2. [Cómo levantar el proyecto](#cómo-levantar-el-proyecto)
3. [Cuentas para probar](#cuentas-para-probar)
4. [Qué hace cada aplicación](#qué-hace-cada-aplicación)
5. [Cómo funciona por dentro](#cómo-funciona-por-dentro)
6. [Estructura de carpetas](#estructura-de-carpetas)
7. [Tests](#tests)
8. [Documentación](#documentación)

---

## Tecnologías

**Backend**
- Node.js + **Express 5** (CommonJS)
- **Sequelize 6** sobre **PostgreSQL**, con migraciones y seeders (`sequelize-cli`)
- **Joi** para validar lo que llega en cada pedido HTTP
- **JWT** (`jsonwebtoken`) + `bcrypt` para la autenticación
- **Socket.IO** para notificaciones y pantallas en tiempo real
- **Cloudinary** + `multer` + `sharp` para subir y optimizar imágenes
- **Nodemailer** para el mail de recuperar contraseña
- **Jest** para los tests

**Frontends** (las tres apps usan el mismo stack)
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- React Router 7, `lucide-react` (íconos), `socket.io-client`
- `@vis.gl/react-google-maps` para los mapas (tienda y panel)
- `recharts` para algunos gráficos del panel
- **Vitest** + Testing Library para los tests (tienda y reparto)
- **oxlint** como linter

---

## Cómo levantar el proyecto

No hay *workspaces*: **cada carpeta tiene su propio `package.json`** y se instala y levanta por separado.

### Requisitos

- Node.js 20 o superior
- PostgreSQL 14 o superior
- (Opcional) Cuentas de Cloudinary, Google Maps y Gmail para las funciones que las usan

### 1. Base de datos

Creá una base vacía en Postgres, por ejemplo `burgerfast`:

```sql
CREATE DATABASE burgerfast;
```

### 2. Backend

```bash
cd Backend
npm install
```

Creá el archivo `Backend/.env`:

```env
# Obligatorias
DATABASE_URL=postgres://usuario:contraseña@localhost:5432/burgerfast
SECRET_JWT_TOKEN=una-frase-larga-y-secreta
PORT=3000

# Imágenes de productos (Cloudinary)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Búsqueda de direcciones (Google Places). La key queda solo en el backend.
GOOGLE_MAPS_API_KEY=

# Mail de "Olvidé mi contraseña" (cuenta de Gmail + contraseña de aplicación)
EMAIL_USER=
EMAIL_APP_PASSWORD=
FRONTEND_URL=http://localhost:5173
```

Creá las tablas y cargá los datos de ejemplo:

```bash
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

> El servidor **no** crea las tablas solo: al arrancar únicamente verifica la conexión.
> Las tablas las crean y modifican las migraciones.

Levantá el servidor:

```bash
npm run dev        # http://localhost:3000
```

### 3. Las tres apps web

En tres terminales distintas:

```bash
cd Frontend   && npm install && npm run dev
cd admin      && npm install && npm run dev
cd repartidor && npm install && npm run dev
```

Vite usa el puerto **5173** para la primera app que se levanta, **5174** para la segunda y
**5175** para la tercera. El backend acepta pedidos (CORS) solo desde esos tres puertos
(ver `Backend/src/config/cors.js`).

Variables de entorno opcionales (archivo `.env` en cada carpeta):

| App | Variable | Para qué |
|---|---|---|
| `Frontend` | `VITE_API_URL` | Dirección del backend (por defecto `http://localhost:3000`) |
| `Frontend` | `VITE_GOOGLE_MAPS_API_KEY` | Mapa de sucursales y selector de dirección. Sin ella, se muestra un aviso |
| `admin` | `VITE_API_URL` | Dirección del backend (por defecto `http://localhost:3000`) |
| `admin` | `VITE_GOOGLE_MAPS_API_KEY` | Elegir en el mapa la ubicación de una sucursal |
| `repartidor` | `VITE_API_URL` | Dirección del backend (por defecto `http://localhost:3000`) |

### Comandos por carpeta

| Carpeta | Desarrollo | Tests | Lint | Build |
|---|---|---|---|---|
| `Backend` | `npm run dev` | `npm test` · `npm run test:coverage` | — | — |
| `Frontend` | `npm run dev` | `npm test` · `npm run test:coverage` | `npm run lint` | `npm run build` |
| `admin` | `npm run dev` | — | `npm run lint` | `npm run build` |
| `repartidor` | `npm run dev` | `npm test` | `npm run lint` | `npm run build` |

`npm run build` corre `tsc -b` antes de Vite, así que también revisa los tipos.

---

## Cuentas para probar

Las crean los seeders:

| Dónde | Usuario | Contraseña | Notas |
|---|---|---|---|
| Panel (`admin`) | `admin@master.com` | `Admin1234` | Administrador **master**: ve todas las sucursales |
| Tienda (`Frontend`) | `cliente001@historia.burgerfast` … `cliente650@historia.burgerfast` | `demo1234` | Clientes con 14 meses de historial de pedidos |

- Los **administradores de sucursal** y los **repartidores** se crean desde el panel, con la cuenta master.
- Desde la tienda también se puede registrar un cliente nuevo.

### Qué cargan los seeders

- **Catálogo completo:** 8 sucursales, 7 categorías, 57 productos (con combos y tamaños), 46 insumos,
  recetas y stock por sucursal. Las imágenes se suben a Cloudinary.
- **Promociones iniciales** y árbol de categorías con íconos.
- **Historia de ventas** para que los reportes tengan qué mostrar: unos 650 clientes y 14 meses de
  pedidos. Cada sucursal tiene su "personalidad" (más o menos ventas, más rápida o más lenta,
  su producto favorito), hay picos de mediodía y noche, fines de semana más movidos, clientes
  que dejaron de pedir y pedidos en curso en este momento. Usa una semilla fija: siempre genera
  lo mismo.
- **Motivos de cancelación** de ejemplo para el reporte de cancelados.

---

## Qué hace cada aplicación

### Tienda (`Frontend/`) — clientes

- **Carta** por categorías con buscador, detalle de producto con tamaños, ingredientes y combos
  ("acompañamiento" y bebida a elección).
- **Promociones:** promos del día, producto de la semana, regalo por compra mínima y
  "Nuevo en la carta" destacado en el inicio.
- **Carrito** guardado en el navegador; al confirmar se envía completo al servidor.
- **Checkout** con envío a domicilio o retiro en el local. La dirección se elige con un buscador
  de Google y un mapa; no se pueden guardar direcciones repetidas.
- **Sucursal automática:** el pedido va a la sucursal activa más cercana que tenga stock para
  prepararlo. Si ninguna puede, el cliente elige entre las disponibles.
- **Seguimiento en vivo** del pedido y **campana de notificaciones** (pedido confirmado, en camino,
  cancelado con su motivo, etc.).
- **Cartas "Te extrañamos":** si el local le manda una, llega como notificación y al tocarla se
  abre la carta.
- **Mi cuenta:** perfil, direcciones, seguridad, historial de pedidos (con "repetir pedido") y
  calificaciones.
- Registro, inicio de sesión y recuperación de contraseña por mail.

### Panel de administración (`admin/`)

Hay dos roles:
- **Master:** ve y administra todo, en todas las sucursales.
- **Admin de sucursal:** ve y administra solo su sucursal.

Secciones:

| Sección | Qué permite |
|---|---|
| **Pedidos** | Ver los pedidos en curso y avanzarlos de estado. Para cancelar hay que elegir o escribir un motivo, que le llega al cliente. |
| **Productos** | Alta, baja y modificación. La receta es obligatoria, así el stock se descuenta por insumo. Combos con producto principal y grupos de opciones. |
| **Categorías** | Árbol de categorías y subcategorías, con ícono y fondo. Buscador. |
| **Insumos** y **Stock** | Stock por sucursal, stock mínimo con alerta, movimientos con historial paginado. |
| **Promociones** | Lista de promos y formulario de alta/edición en otra pantalla: promo del día, producto de la semana, regalo y "Nuevo en la carta". |
| **Sucursales** | Datos, ubicación en el mapa, horarios, abrir o cerrar. |
| **Administradores** y **Repartidores** | Alta y gestión de cuentas. |
| **Viajes** | Seguimiento de los repartos y asistencia cuando un viaje la pide. |
| **Calificaciones** | Moderar las reseñas de los clientes. |
| **Parámetros** | Radio de entrega, costo de envío (base + por km), tiempos estimados de preparación y viaje, pedidos en curso por repartidor y días para calificar. |
| **Reportes** | Ver más abajo. |

#### Reportes

Cada reporte tiene una animación temática para que se entienda de un vistazo. Por defecto
muestran los **últimos 30 días** (no hay opción "histórico" para no recorrer toda la base).

- **Productos:** más vendidos (con lluvia de hamburguesas), menos vendidos (en la "heladera"),
  sin stock (con orden de reposición) y mayor facturación (torres de monedas).
- **Pedidos:** cinta de pedidos, tiempos por etapa con **cuello de botella** y sucursales lentas,
  pedidos demorados, y **ranking de motivos de cancelación**.
- **Sucursales:** "vasos de la meta" (cada sucursal se llena según cuánto lleva de lo que vendió
  el mes anterior; tira confeti al llegar), carrera entre sucursales y la **bandeja** con los
  productos más pedidos de cada sucursal.
- **Clientes:** clientes nuevos, tarjeta de sellos de los fieles y **buzón de inactivos**, desde
  donde se les manda la carta "Te extrañamos" (con control para no mandar dos veces seguidas).
- **Promociones:** cuánto se usa cada promo y cuánto descuento se dio.

### App de reparto (`repartidor/`)

- Inicio de sesión del repartidor.
- Lista de pedidos listos para retirar en su sucursal; los toma y arma su **viaje**.
- Durante el viaje, una barra fija (abajo en escritorio, arriba en el celular) muestra el
  pedido actual. El repartidor marca **en camino** y **entregado**.
- Puede pedir **asistencia** si tiene un problema; el panel la recibe al instante.
- Historial de viajes y notificaciones propias (viaje asignado, reasignado, pedido cancelado
  en pleno viaje, etc.).

---

## Cómo funciona por dentro

### Estados de un pedido

```
pendiente ──► en proceso ──► listo para retirar ──► en camino ──► entregado
    │              │                  │
    └──────────────┴──────────────────┴──► cancelado (con motivo)
```

- El **panel** mueve el pedido hasta *listo para retirar* (o lo cancela).
- El **repartidor** lo pasa a *en camino* y a *entregado*.
- *Entregado* y *cancelado* son finales: ya no se pueden cambiar.
- Cada cambio queda registrado con su hora; con eso se calculan las demoras de los reportes.

### Autenticación

- Al iniciar sesión, el backend entrega un **JWT**. Se manda en el header
  `Authorization: Bearer <token>` o, en el panel, en la cookie `access_token`.
- Hay middlewares por tipo de usuario: cliente (`autenticacion.js`), administrador
  (`admin/esAdminJwt.js`), master (`admin/esMasterJwt.js`) y repartidor
  (`repartidor/esRepartidorJwt.js`).
- Si se desactiva una cuenta, su sesión se corta también en los sockets (`sockets/revocacion.js`).

### Notificaciones en tiempo real

Las notificaciones usan el **patrón estrategia**:

1. Pasa algo en el sistema (cambia el estado de un pedido, baja el stock, se asigna un viaje…).
2. Un *handler* (`notifications/handlers/`) le pide a la fábrica (`fabricaNotificaciones.js`)
   que publique un aviso de ese tipo.
3. La **estrategia** de ese tipo (`notifications/estrategias/*.strategy.js`) decide a quién le
   llega y con qué datos.
4. Se guarda en la base (`notificaciones` y `notificacion_destinatarios`) y se envía por
   **Socket.IO** a la sala de cada destinatario.

Del lado de las apps pasa lo mismo al revés: cada tipo de aviso tiene su estrategia en
`src/utils/notificaciones/estrategias/` (tienda) o `src/notificaciones/` (reparto), que
decide el texto, el ícono y qué pasa al tocarlo.

Para sumar un tipo nuevo alcanza con agregar una estrategia en el backend y otra en la app
que lo muestra.

### Stock por receta

Cada producto tiene una **receta** (qué insumos lleva y cuánto). Así:
- el stock se controla por **insumo y por sucursal**;
- un producto está disponible en una sucursal solo si le alcanzan los insumos;
- cuando un insumo llega al mínimo, los admins reciben la alerta de **stock bajo**.

### Validación y errores

- Todo lo que entra a la API pasa por un esquema **Joi** (`src/schemas/`) o un middleware de
  validación (`src/middleware/`).
- Los errores se devuelven en español, con un `mensaje` pensado para mostrarle al usuario.

---

## Estructura de carpetas

```
Pagina-de-ecommerce/
├── Backend/
│   ├── src/
│   │   ├── main.js            # Arranca Express y Socket.IO
│   │   ├── config/            # Base de datos, CORS, Cloudinary, constantes
│   │   ├── controllers/       # Lógica de cada recurso (admin/ y repartidor/ aparte)
│   │   ├── routes/            # Rutas públicas, /admin/* y /repartidor/*
│   │   ├── middleware/        # Autenticación y validaciones
│   │   ├── schemas/           # Esquemas Joi
│   │   ├── models/            # Modelos Sequelize
│   │   ├── migrations/        # Cambios de la base, en orden
│   │   ├── seeders/           # Datos de ejemplo (y sus JSON en datos/)
│   │   ├── notifications/     # Sistema de notificaciones (estrategias, handlers, canal)
│   │   ├── sockets/           # Salas, suscripciones y autenticación de Socket.IO
│   │   ├── services/          # Auth y mails
│   │   └── utils/             # Distancias, horarios, stock, promos, JWT…
│   └── tests/                 # Tests de Jest
├── Frontend/                  # Tienda (src/pages, components, context, services, utils, test)
├── admin/                     # Panel (src/pages, components, services, types, utils)
├── repartidor/                # App de reparto (src/pages, components, notificaciones, realtime)
└── doc/                       # Enunciado y análisis de requerimientos
```

### Rutas principales de la API

| Prefijo | Para |
|---|---|
| `/productos`, `/categorias`, `/tamanios`, `/promociones`, `/sucursales`, `/parametros` | Carta y datos públicos de la tienda |
| `/usuario`, `/direcciones`, `/pedido`, `/calificaciones` | Cuenta, direcciones, pedidos y reseñas del cliente |
| `/notificaciones`, `/notificaciones/cliente` | Bandeja de notificaciones |
| `/geo` | Búsqueda de direcciones (intermediario con Google Places) |
| `/admin/*` | Todo el panel: productos, stock, pedidos, sucursales, reportes, etc. |
| `/repartidor/*` | Login, pedidos, viajes y notificaciones del repartidor |

---

## Tests

```bash
cd Backend    && npm test     # Jest: controladores, middlewares, esquemas, notificaciones, sockets…
cd Frontend   && npm test     # Vitest: componentes, contextos, hooks, tiempo real, utilidades
cd repartidor && npm test     # Vitest
```

Los tests del backend no necesitan una base real: los modelos se reemplazan por *mocks*.

---

## Documentación

- [`doc/enunciado.md`](doc/enunciado.md) — consigna del trabajo práctico (la fuente de verdad).
- [`doc/analisis-requerimientos.md`](doc/analisis-requerimientos.md) — análisis de requerimientos (borrador).
- [`.agents.md`](.agents.md) y [`AGENTS.md`](AGENTS.md) — contexto del negocio y convenciones del código.
=======

