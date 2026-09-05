# Análisis de Requerimientos — Plataforma de Delivery

## 1. Alcance y arquitectura

Aplicación web responsiva para cadena de comida rápida. Los clientes realizan pedidos de delivery desde una app; los administradores gestionan la operación desde un sistema administrativo. Ambas aplicaciones comparten una única base de datos.

> "Todas las aplicaciones deberán compartir la **misma base de datos**." (enunciado, L11)

> "Se deberá contemplar el proceso completo desde la configuración de productos hasta la entrega del pedido al cliente." (L12)

- **Frontend:** un solo SPA React + Vite + TypeScript. Área pública (clientes) y área administrativa bajo `/admin`, protegida por rol.
- **Backend:** Node.js + Express API REST, PostgreSQL vía Sequelize (esqueleto ya presente en `Pagina de ecommerce - Backend`).
- **Autenticación:** JWT con roles `cliente` / `administrador`. El sistema nace con un administrador inicial creado por seed.

## 2. Funcionalidades a desarrollar (con citas del enunciado)

### 2.1 Gestión de usuarios

- Registro, inicio de sesión y recuperación de contraseña de clientes.
- Modificación de datos personales, gestión de direcciones de entrega, consulta de pedidos anteriores y realización de nuevos pedidos.

> "Podrán: Registrarse. Iniciar sesión. Recuperar contraseña. Modificar sus datos personales. Administrar sus direcciones de entrega. Consultar pedidos anteriores. Realizar nuevos pedidos." (L23–30)

- El sistema nace con un administrador inicial y los administradores pueden crear nuevos administradores.

> "El sistema nace con un administrador inicial." (L34)

> "Los administradores podrán crear nuevos administradores." (L35)

### 2.2 Gestión de sucursales

- ABM de sucursales con nombre, dirección, latitud/longitud, horarios de atención, teléfono y estado activa/inactiva.

> "Cada sucursal representa un local físico. De cada una interesa registrar, entre otros datos: Nombre, Dirección, Ubicación geográfica (latitud y longitud), Horarios de atención, Teléfono, Estado (activa/inactiva)." (L38–44)

- Asignación automática de la sucursal que prepara cada pedido.

> "La aplicación deberá determinar desde qué sucursal preparar un pedido." (L47)

Estrategia elegida: **sucursal activa más cercana a la dirección de entrega con stock suficiente**; si ninguna la cubre, el cliente elige entre las disponibles.

### 2.3 Catálogo de productos

- ABM de productos (nombre, descripción, categoría, precio, imagen, estado disponible/no disponible) y categorías administrables.

> "Los administradores podrán gestionar el catálogo de productos." (L55)

> "nombre, descripción, categoría, precio, imagen, estado (disponible/no disponible)." (L56)

> "Categorías administrables: (Ejemplos: Hamburguesas, Combos, Papas, Nuggets, Bebidas, Postres, Salsas)." (L57)

- Configuraciones especiales por producto (ingredientes adicionales/eliminados, tamaños, sabores).

> "Cada grupo deberá definir si algunos productos pueden tener configuraciones (Ej: ingredientes adicionales, eliminación de ingredientes, tamaños, sabores, promociones)." (L58)

### 2.4 Carrito de compras

- Agregar productos indicando cantidad, observaciones y configuraciones especiales. Se implementa en el cliente (localStorage); el servidor recibe el carrito finalizado al confirmar.

> "Para cada producto incluido se debe poder indicar: **cantidad, observaciones y configuraciones especiales** (si correspondiera)." (L62)

- Cálculo del importe total y edición del carrito antes de confirmar.

> "La aplicación calculará el importe total." (L63)

> "El cliente podrá modificar el carrito antes de confirmar el pedido." (L64)

### 2.5 Realización de pedidos

- Registro mínimo del pedido: cliente, sucursal asignada, dirección de entrega, fecha y hora, detalle de productos, importe y estado inicial.

> "Al confirmar el pedido se deberán registrar, como mínimo: `cliente`, `sucursal asignada`, `dirección de entrega`, `fecha y hora`, `detalle de productos`, `importe` y `estado inicial`." (L67)

- Flujo de estados parametrizable: Pendiente → Confirmado → En preparación → Listo para entregar → En camino → Entregado (o Cancelado).

> "Cada pedido atravesará diferentes **estados**... 1. Pendiente 2. Confirmado 3. En preparación 4. Listo para entregar 5. En camino 6. Entregado 7. Cancelado" (L69–77)

### 2.6 Geolocalización

- Direcciones con ubicación geográfica además de la dirección textual.

> "Además de la dirección textual deberá almacenarse la **ubicación geográfica**." (L82)

- Uso de la geolocalización para asignar la sucursal y mostrar las disponibles.

> "La aplicación utilizará dicha información para determinar desde qué sucursal preparar el pedido y mostrar al cliente las sucursales disponibles." (L83)

- **(Opcional, fuera del alcance inicial)** mapa con ubicación del cliente, sucursal y recorrido estimado. (L84)

### 2.7 Seguimiento del pedido

- El cliente consulta la sucursal asignada, el estado actual, la fecha y hora de cada cambio de estado y el tiempo estimado de entrega.

> "El sistema mostrará: Qué sucursal está preparando / preparó el pedido. Estado actual. Fecha y hora de cada cambio de estado. Tiempo estimado de entrega..." (L87–91)

### 2.8 Historial

- Consulta de pedidos anteriores con detalle, importe, fecha y estado final, y opción de repetir pedidos.

> "Pedidos realizados y detalle de cada uno. Importe, fecha y estado final. Opción para **repetir pedidos anteriores**." (L95–97)

### 2.9 Sistema administrativo

- ABM (CRUD) de: Productos, Categorías, Promociones, Sucursales, Stock, Administradores, Estados generales y Parámetros del sistema.

> "Desde allí podrán administrar mediante operaciones de alta, baja, modificación y consulta **(CRUD/ABM)** las siguientes entidades: Productos, Categorías, Promociones, Sucursales, Stock, Administradores, Estados generales, Parámetros del sistema." (L104–112)

- Gestión operativa de pedidos (transición de estados) para completar el proceso hasta la entrega (deriva de L12).

### 2.10 Reportes de productos

> "El sistema administrativo deberá ofrecer, al menos, las siguientes consultas y estadísticas relacionadas a **Productos**: Productos más vendidos. Productos menos vendidos. Productos sin stock. Productos con mayor facturación." (L119–123)

### 2.11 Aplicación de repartidores

- Es **opcional** en el enunciado (L9). **Fuera del alcance inicial**; se deja la base de datos preparada para incorporarla más adelante.

## 3. Mapa de páginas

### Área clientes (pública; requiere login para comprar y ver pedidos)

| Ruta                              | Página                                                                 |
|-----------------------------------|------------------------------------------------------------------------|
| `/`                               | Home: presentación, categorías destacadas, CTA al menú                 |
| `/menu`                           | Catálogo: filtros por categoría/búsqueda, cards de productos disponibles |
| `/producto/:id`                   | Detalle: descripción, imagen, configuraciones (tamaños/ingredientes), cantidad, agregar al carrito |
| `/carrito`                        | Carrito: items con cantidad/observaciones/configs, edición, total      |
| `/checkout`                       | Confirmar pedido: selección de dirección, sucursal asignada, resumen, confirmar |
| `/login` · `/registro`            | Acceso y alta de cliente                                               |
| `/recuperar-contrasena` · `/recuperar-contrasena/:token` | Recupero de contraseña                          |
| `/perfil`                         | Modificar datos personales                                             |
| `/perfil/direcciones`             | ABM de direcciones de entrega                                          |
| `/pedidos`                        | Historial de pedidos                                                   |
| `/pedido/:id`                     | Seguimiento: estado actual, historial de cambios, repetir pedido       |

### Área administración (`/admin`, protegida por rol)

| Ruta                                  | Página                                                          |
|---------------------------------------|-----------------------------------------------------------------|
| `/admin/login`                        | Acceso de administradores                                       |
| `/admin`                              | Dashboard con KPIs y accesos                                    |
| `/admin/pedidos`                      | Listado y gestión de pedidos (transición de estados)            |
| `/admin/productos` · `/admin/productos/:id` | Listado + alta/edición de productos                         |
| `/admin/categorias`                   | Gestión de categorías                                           |
| `/admin/promociones`                  | Gestión de promociones                                          |
| `/admin/sucursales`                   | Gestión de sucursales (datos, horarios, estado)                 |
| `/admin/stock`                        | Stock por sucursal × producto                                   |
| `/admin/administradores`              | Gestión de administradores                                      |
| `/admin/estados`                      | Estados del flujo de pedidos                                    |
| `/admin/parametros`                   | Parámetros del sistema                                          |
| `/admin/reportes`                     | Reportes de productos                                           |

## 4. Esquema de endpoints (API REST, base `/api`)

Convenciones: roles requeridos indicados entre `[ ]`; las operaciones que involucran creación de pedidos y stock se ejecutan en transacciones. El carrito vive en el cliente y se envía completo al confirmar.

### Auth

| Método | Endpoint                        | Rol     | Descripción                              |
|--------|---------------------------------|---------|-------------------------------------------|
| POST   | `/api/auth/registro`            | público | Alta de cliente                           |
| POST   | `/api/auth/login`               | público | Login cliente/admin, devuelve JWT         |
| POST   | `/api/auth/recuperar`           | público | Solicitar recuperación (email)            |
| PUT    | `/api/auth/recuperar/:token`    | público | Establecer nueva contraseña               |
| GET    | `/api/auth/perfil`              | auth    | Datos del usuario autenticado             |

### Usuarios y direcciones

| Método | Endpoint                                        | Rol      | Descripción                      |
|--------|-------------------------------------------------|----------|----------------------------------|
| PUT    | `/api/usuarios/:id`                             | cliente  | Modificar datos personales       |
| GET    | `/api/usuarios/:id/direcciones`                 | cliente  | Listar direcciones de entrega    |
| POST   | `/api/usuarios/:id/direcciones`                 | cliente  | Crear dirección (con lat/lng)    |
| PUT    | `/api/usuarios/:id/direcciones/:idDir`          | cliente  | Modificar dirección              |
| DELETE | `/api/usuarios/:id/direcciones/:idDir`          | cliente  | Eliminar dirección               |

### Administradores

| Método | Endpoint                      | Rol    | Descripción                  |
|--------|-------------------------------|--------|------------------------------|
| GET    | `/api/administradores`        | admin  | Listar administradores       |
| POST   | `/api/administradores`        | admin  | Crear administrador          |
| PUT    | `/api/administradores/:id`    | admin  | Modificar administrador      |
| DELETE | `/api/administradores/:id`    | admin  | Eliminar administrador       |

### Sucursales

| Método | Endpoint                              | Rol      | Descripción                              |
|--------|---------------------------------------|----------|------------------------------------------|
| GET    | `/api/sucursales`                     | público  | Sucursales activas                        |
| GET    | `/api/sucursales/disponibles?lat=&lng=` | público | Candidatas por cercanía (asignación)   |
| GET    | `/api/sucursales/:id`                 | público  | Detalle de sucursal                       |
| POST   | `/api/sucursales`                     | admin    | Crear sucursal                            |
| PUT    | `/api/sucursales/:id`                 | admin    | Modificar sucursal                        |
| DELETE | `/api/sucursales/:id`                 | admin    | Eliminar sucursal                         |

### Catálogo

| Método | Endpoint                                | Rol      | Descripción                                  |
|--------|-----------------------------------------|----------|----------------------------------------------|
| GET    | `/api/categorias`                       | público  | Listar categorías                            |
| POST   | `/api/categorias`                       | admin    | Crear categoría                              |
| PUT    | `/api/categorias/:id`                   | admin    | Modificar categoría                          |
| DELETE | `/api/categorias/:id`                   | admin    | Eliminar categoría                           |
| GET    | `/api/productos?categoria=&busqueda=`   | público  | Catálogo público (solo disponibles)          |
| GET    | `/api/productos/:id`                    | público  | Detalle de producto (con configuraciones)    |
| POST   | `/api/productos`                        | admin    | Crear producto                               |
| PUT    | `/api/productos/:id`                    | admin    | Modificar producto                           |
| DELETE | `/api/productos/:id`                    | admin    | Eliminar producto                            |
| GET    | `/api/productos/:id/configuraciones`    | público  | Opciones/ingredientes/tamaños/sabores        |
| POST   | `/api/productos/:id/configuraciones`    | admin    | Crear configuración                          |
| PUT    | `/api/productos/:id/configuraciones/:idCfg` | admin | Modificar configuración                   |
| DELETE | `/api/productos/:id/configuraciones/:idCfg` | admin | Eliminar configuración                    |
| POST   | `/api/uploads/imagenes`                 | admin    | Subida de imágenes de producto               |

### Promociones

| Método | Endpoint                      | Rol     | Descripción                 |
|--------|-------------------------------|---------|-----------------------------|
| GET    | `/api/promociones`            | público | Promociones activas         |
| POST   | `/api/promociones`            | admin   | Crear promoción             |
| PUT    | `/api/promociones/:id`        | admin   | Modificar promoción         |
| DELETE | `/api/promociones/:id`        | admin   | Eliminar promoción          |

### Stock

| Método | Endpoint                      | Rol    | Descripción                              |
|--------|-------------------------------|--------|------------------------------------------|
| GET    | `/api/sucursales/:id/stock`   | público | Disponibilidad por sucursal             |
| POST   | `/api/stock`                  | admin  | Cargar stock (sucursal × producto)       |
| PUT    | `/api/stock/:id`              | admin  | Ajustar stock                            |

### Pedidos

| Método | Endpoint                          | Rol     | Descripción                                  |
|--------|-----------------------------------|---------|-----------------------------------------------|
| POST   | `/api/pedidos`                    | cliente | Confirmar pedido; asigna sucursal y calcula total |
| GET    | `/api/pedidos`                    | cliente | Historial propio (filtros fecha/estado)       |
| GET    | `/api/pedidos/:id`                | cliente | Detalle + sucursal asignada                   |
| GET    | `/api/pedidos/:id/estados`        | cliente | Historial de cambios de estado (fecha/hora)   |
| POST   | `/api/pedidos/:id/cancelar`       | cliente | Cancelación válida según estado               |
| POST   | `/api/pedidos/:id/repetir`        | cliente | Reusar pedido anterior                        |
| GET    | `/api/admin/pedidos?estado=`      | admin   | Listado general de pedidos                    |
| PUT    | `/api/admin/pedidos/:id/estado`   | admin   | Transición de estado                          |

### Parámetros y reportes

| Método | Endpoint                                  | Rol    | Descripción                          |
|--------|-------------------------------------------|--------|--------------------------------------|
| GET    | `/api/estados`                            | público| Listar estados generales             |
| POST   | `/api/estados`                            | admin  | Crear estado                         |
| PUT    | `/api/estados/:id`                        | admin  | Modificar estado                     |
| DELETE | `/api/estados/:id`                        | admin  | Eliminar estado                      |
| GET    | `/api/parametros`                         | público| Parámetros públicos del sistema      |
| PUT    | `/api/parametros/:id`                     | admin  | Modificar parámetro                  |
| GET    | `/api/reportes/productos-mas-vendidos`    | admin  | Reporte: más vendidos                |
| GET    | `/api/reportes/productos-menos-vendidos`  | admin  | Reporte: menos vendidos              |
| GET    | `/api/reportes/productos-sin-stock`       | admin  | Reporte: sin stock                   |
| GET    | `/api/reportes/productos-mayor-facturacion` | admin | Reporte: mayor facturación         |

## 5. Decisiones técnicas y siguientes pasos

- Autenticación con JWT + bcrypt; seed del administrador inicial.
- Asignación de sucursal: más cercana + activa + stock suficiente, ejecutada en transacción al crear el pedido.
- Tablas propuestas (extienden el esqueleto existente): `Usuarios` (con rol), `Direcciones`, `Sucursales`, `Categorias`, `Productos`, `ConfiguracionesProducto`, `Stock`, `Promociones`, `Pedidos`, `DetallePedidos`, `HistorialEstados`, `EstadosGenerales`, `Parametros`.
- Próximos pasos propuestos:
  1. Modelo de datos + migraciones.
  2. Autenticación y gestión de usuarios.
  3. Catálogo (categorías/productos/configuraciones) y sucursales.
  4. Pedidos, seguimiento e historial.
  5. Sistema administrativo y reportes.