# Plan de Ejecución — Sistema de Notificaciones en Tiempo Real

Backend Express 5 + Sequelize + PostgreSQL. Fase backend exclusivamente.

## 1. Diagnóstico del estado actual

- `Backend/src/main.js` usa `app.listen()` directo; para Socket.io hace falta un `http.Server`.
- Conviven dos sistemas de autenticación incompatibles:
  - `utils/jwt.js` firma con `JWT_SECRET`, variable que no existe en `.env`.
  - El login admin firma con `SECRET_JWT_TOKEN` y guarda cookie `access_token`.
  - El login cliente no emite token.
- Los controladores de pedidos concentran lógica de negocio, permisos, transacciones e historial.
- No existe modelo de notificaciones.
- No se implementa nada de repartidores en esta fase.

## 2. Decisiones de arquitectura

1. **JWT único para todos los roles.**
   - Secreto único: `SECRET_JWT_TOKEN`.
   - Payload: `{ sub, tipo, rol }`.
   - `tipo`: `usuario` | `admin`. El tipo `repartidor` queda reservado, sin implementación.
2. **Despachador desacoplado por canales (estrategia).**
   - `notificacionService` construye y persiste la notificación.
   - Los canales implementan `enviar(notificacion)`.
   - La lógica HTTP/pedidos no importa Socket.io; solo usa `notificacionService`.
3. **Persistencia en BD con fan-out de destinatarios.**
   - Tablas `notificaciones` y `notificacion_destinatarios`.
4. **Salas con prefijo de tipo para evitar colisiones entre IDs.**
   - `user:cliente:${id}`, `user:admin:${id}`
   - `role:cliente`, `role:admin`
   - `sucursal:${id}`
   - `admin:sucursal:${id}`
   - `pedido:${id}`
   - `delivery:${id}` queda reservado en documentación, sin código en esta fase.
5. **Refactor de pedidos a services.**
   - `services/pedidoService.js` → creación de pedido.
   - `services/pedidoAdminService.js` → cambio de estado.
   - Controladores como capa HTTP delgada.
6. **DTOs planos después del commit.**
   - Los handlers nunca reciben instancias de Sequelize.
   - La notificación se publica únicamente después de `commit()`.
7. **Handshake de Socket.io solo con `socket.handshake.auth.token`.**
   - Sin lectura de cookies en sockets.
   - El login admin devuelve `token` además de setear la cookie HTTP.
8. **Aislamiento total de Repartidores.**
   - Sin modelos, migraciones, seeders, rutas, controladores ni handlers.
   - Solo se documenta el punto de extensión.

## 3. Estructura propuesta

```txt
Backend/src/
├── config/
│   └── cors.js
├── notifications/
│   ├── events.js
│   ├── destinatarios.js
│   ├── notificacionRepository.js
│   ├── notificacionService.js
│   ├── canales/
│   │   └── socketChannel.js
│   └── handlers/
│       ├── pedidoHandlers.js
│       └── sucursalHandlers.js
├── sockets/
│   ├── index.js
│   ├── autenticacion.js
│   ├── salas.js
│   └── suscripciones.js
├── services/
│   ├── authService.js
│   ├── pedidoService.js
│   ├── pedidoAdminService.js
│   └── pedido/
│       ├── stock.js
│       ├── combos.js
│       └── promociones.js
├── utils/
│   ├── dto/
│   │   ├── pedidoDto.js
│   │   └── sucursalDto.js
│   └── errors.js
├── controllers/notificacionController.js
├── routes/notificacionRoutes.js
├── schemas/notificacion.schema.js
└── middleware/autenticacion.js
```

Modelos nuevos:

```txt
src/models/notificacion.js
src/models/notificacionDestinatario.js
src/migrations/20261102120000-crear-notificaciones.js
```

## 4. Contratos

### 4.1 Eventos

```js
const TIPOS = Object.freeze({
  PEDIDO_ESTADO_CAMBIADO: 'pedido.estado_cambiado',
  SUCURSAL_CERRADA: 'sucursal.cerrada',
  PEDIDO_CREADO: 'pedido.creado',
});
```

Envelope:

```js
{
  id: 123,
  tipo: 'pedido.estado_cambiado',
  version: 1,
  ocurridoEn: '2026-11-02T15:00:00.000Z',
  datos: {
    pedidoId: 45,
    estadoAnterior: 'pendiente',
    estado: 'en proceso',
    usuarioId: 8,
    sucursalId: 2,
    total: 15400,
    fecha: '2026-11-02T14:55:00.000Z'
  },
  destinos: {
    clientes: [8],
    administradoresSucursal: [2],
    pedidos: [45]
  }
}
```

### 4.2 DTOs planos

```js
function pedidoADto(pedido, estadoAnterior = null) {
  return Object.freeze({
    pedidoId: Number(pedido.id),
    usuarioId: Number(pedido.usuarioId),
    sucursalId: Number(pedido.sucursalId),
    estadoAnterior,
    estado: String(pedido.estado),
    total: Number(pedido.total),
    fecha: new Date(pedido.fecha).toISOString(),
  });
}
```

Flujo obligatorio:

```js
const { pedido, estadoAnterior } = await pedidoAdminService.cambiarEstadoPedido({
  pedido,
  nuevoEstado: estado,
  adminId: admin.id,
});

const dto = pedidoADto(pedido, estadoAnterior);
await notificarEstadoPedido(dto);
```

### 4.3 Servicio de notificaciones

```js
class NotificacionService {
  constructor({ repository, canales = [] }) {
    this.repository = repository;
    this.canales = canales;
  }

  usarCanal(canal) {
    this.canales.push(canal);
    return this;
  }

  async publicar({ tipo, datos, destinos = {} }) {
    try {
      const notificacion = await this.repository.guardar({
        tipo, datos, destinos, version: 1, ocurridoEn: new Date(),
      });

      await Promise.allSettled(
        this.canales.map((canal) => canal.enviar(notificacion))
      );

      return notificacion;
    } catch (error) {
      console.error('No se pudo publicar la notificación:', error.message);
      return null;
    }
  }
}
```

### 4.4 Handshake

```js
function autenticarSocket(socket, next) {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error('AUTH_REQUIRED'));
  }

  resolverIdentidad(token)
    .then((identidad) => {
      socket.data.identidad = identidad;
      next();
    })
    .catch(() => next(new Error('AUTH_INVALID')));
}
```

Códigos: `AUTH_REQUIRED`, `AUTH_INVALID`.

### 4.5 Salas

```js
const SALAS = Object.freeze({
  usuario: (tipo, id) => `user:${tipo}:${id}`,
  rol: (rol) => `role:${rol}`,
  sucursal: (id) => `sucursal:${id}`,
  adminSucursal: (id) => `admin:sucursal:${id}`,
  pedido: (id) => `pedido:${id}`,
});
```

### 4.6 Suscripciones y control de fugas

- Máximo 20 pedidos suscritos por socket.
- TTL de 2 horas por suscripción.
- `pedido:desuscribir` idempotente.
- Limpieza de timers en `disconnect`.
- En React, el `useEffect` debe retornar el cleanup con `pedido:desuscribir`.

```js
socket.on('pedido:desuscribir', (pedidoId, ack) => {
  const timeout = socket.data.pedidos.get(pedidoId);
  if (timeout) clearTimeout(timeout);

  socket.leave(SALAS.pedido(pedidoId));
  socket.data.pedidos.delete(pedidoId);
  ack?.({ ok: true });
});
```

### 4.7 Logout

```ts
function logout() {
  socket.disconnect();

  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('cart');

  setUser(null);
  setToken(null);
  clearCart();
}
```

Admin:

```ts
async function logout() {
  await cerrarSesionService();
  socket.disconnect();

  localStorage.removeItem('administrador');
  localStorage.removeItem('token');
}
```

## 5. Persistencia

### `notificaciones`

| columna | tipo | nota |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `tipo` | STRING | |
| `version` | INTEGER | default 1 |
| `datos` | JSONB | payload específico |
| `destinos` | JSONB | regla original |
| `ocurrido_en` | DATE | |
| `created_at`, `updated_at` | DATE | |

### `notificacion_destinatarios`

| columna | tipo | nota |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `notificacion_id` | FK | `ON DELETE CASCADE` |
| `destinatario_tipo` | STRING | `cliente` / `admin` |
| `destinatario_id` | INTEGER | |
| `leida` | BOOLEAN | default false |
| `leida_en` | DATE | null |
| `created_at`, `updated_at` | DATE | |

Índices:

- `UNIQUE(notificacion_id, destinatario_tipo, destinatario_id)`
- `INDEX(destinatario_tipo, destinatario_id, leida)`

## 6. Fases

### Fase 0 — Baseline

- Ejecutar `npm test` en `Backend/`.
- Verificar `.env`: `DATABASE_URL`, `PORT`, `SECRET_JWT_TOKEN`.
- Confirmar que `JWT_SECRET` deja de usarse.

Criterio: tests verdes antes de tocar código.

### Fase 1 — Bootstrap HTTP + Socket.io

- Instalar `socket.io` y `socket.io-client` (dev).
- Crear `config/cors.js` con `origenesPermitidos`.
- Refactorizar `main.js` a `http.createServer(app)` + `inicializarSockets(server)`.
- Crear `sockets/index.js` y `sockets/salas.js`.
- No registrar canales ni handlers todavía.

Criterio: backend arranca, Socket.io queda adjunto al mismo puerto y un cliente puede conectarse.

### Fase 2 — Auth JWT unificada

- `utils/jwt.js` usa `SECRET_JWT_TOKEN`.
- `services/authService.js` con `firmarTokenCliente`, `firmarTokenAdmin` y `resolverIdentidad`.
- Login cliente devuelve `token`.
- Login admin devuelve `token` y mantiene cookie.
- Refactor de middlewares HTTP.
- Actualizar tests de jwt y autenticación.

### Fase 3 — Modelos y migración de notificaciones

- Crear modelos y migración.
- Crear repositorio con guardar/listar/marcar leídas/contar no leídas.
- En desarrollo se permite recrear la BD desde cero.

### Fase 4 — Núcleo de notificaciones

- Eventos, destinatarios, servicio, canal Socket.io y handlers.
- Tests con repository y canal falsos.

### Fase 5 — Auth y salas de Socket.io

- Handshake solo con `auth.token`.
- Auto-join de salas según identidad.
- Suscripciones con TTL, límite y desuscripción.
- Tests de auth y salas.

### Fase 6 — Refactor de pedidos e integración

- Extraer creación y cambio de estado a services.
- Publicar notificaciones después del commit con DTOs planos.
- Notificar cierre de sucursal al desactivar.
- Migrar tests de lógica a services.

### Fase 7 — Bandeja HTTP

- `GET /notificaciones`
- `PATCH /notificaciones/:id/leida`
- `PATCH /notificaciones/leer-todas`
- `GET /notificaciones/no-leidas/count`
- Emitir `notificacion:leida` al marcar leída.

### Fase 8 — Cierre y documentación

- Documentar eventos, payloads, salas y códigos de error.
- Smoke test end-to-end.
- Ejecutar suite completa.

## 7. Preparado para Repartidores

Sin implementar nada en esta fase. El punto de extensión futuro es:

1. Resolver identidad `tipo: 'repartidor'`.
2. Agregar sala `delivery:${id}`.
3. Agregar handler de evento.
4. No modificar `notificacionService` ni controladores de pedidos.

## 8. Riesgos

- Token admin expuesto al JS en desarrollo para permitir `auth.token`; en producción usar ticket efímero.
- Fan-out de `clientesSucursal` puede generar muchas filas.
- Cierre por horario automático queda fuera de esta fase; se notifica desactivación manual y edición de horario.
- JWT stateless: el logout debe desconectar el socket explícitamente.
