# Plan de Notificaciones del Cliente — Parte 1: Arquitectura Base

**Estado:** planificación. No autoriza todavía cambios de código.
**Alcance de esta parte:** auditoría, identidad/sesión, capas, realtime, contratos, estado y prerrequisitos.
**Fuera de esta parte:** campana, bandeja visual, deep links, textos finales, responsive, accesibilidad y matriz UI. Eso corresponde a la Parte 2.

---

## 1. Objetivo

Diseñar la base técnica del sistema de notificaciones en tiempo real del **Frontend del Cliente**, reutilizando el patrón ya probado en `admin/`:

- Una única conexión Socket.io por sesión.
- Un bus de eventos desacoplado de React.
- REST tipado para historial, contador y lecturas.
- Estado de dominio con reducer puro.
- Separación estricta entre tipos, servicios, utilidades, realtime, contexto, hooks y componentes.
- Cero `any`, cero polling global y cero sockets paralelos.

La implementación debe ser independiente de `admin/`. No hay npm workspaces ni paquete compartido, por lo que se replica el patrón y los contratos, no se importan archivos entre aplicaciones.

---

## 2. Resumen ejecutivo

1. **La identidad real del cliente debe ser el JWT**, no el objeto `user` de `localStorage`.
2. El login del cliente ya devuelve `token`, pero el Frontend actual lo descarta. Esto es el prerrequisito principal.
3. El backend ya tiene una única instancia de Socket.io, autenticación por `handshake.auth.token` y auto-join a `user:cliente:${id}`. El frontend no debe unirse manualmente a esa sala.
4. El backend actual expone notificaciones solo para administradores. Falta habilitar el contrato cliente. Sin eso, la base frontend puede desarrollarse, pero no declararse integrada.
5. El frontend usará el `httpClient` existente (en `Frontend/` no existe `apiFetch`; ese nombre pertenece a `admin/`). No se crea un cliente HTTP paralelo.
6. El estado de notificaciones se separa en dos contextos: estado de solo lectura y acciones estables, para evitar renders innecesarios.
7. Se incorpora desde el inicio la lección del cursor inválido: normalización del cursor y recuperación automática ante `CURSOR_INVALIDO`.

---

## 3. Auditoría del estado actual

### 3.1 Sesión del cliente en `Frontend/`

| Evidencia                                                                      | Estado actual                                                    | Implicancia                                                                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Frontend/src/context/AuthContext.tsx:18-32`                                   | Solo guarda `user` en `localStorage`.                            | No hay token disponible para Socket.io.                                                                           |
| `Frontend/src/context/AuthContext.tsx:55`                                      | `isAuthenticated: !!user`.                                       | Un `user` viejo o manipulado se considera sesión válida.                                                          |
| `Frontend/src/services/authService.ts:15-20`                                   | El login mapea `id/nombre/email` y descarta el resto.            | El `token` que devuelve el backend se pierde.                                                                     |
| `Frontend/src/services/httpClient.ts:4-10`                                     | Envía `Content-Type` y opciones, pero no `Authorization`.        | Las peticiones REST del cliente no transportan identidad JWT.                                                     |
| `Frontend/src/services/orderService.ts`, `addressService.ts`, `userService.ts` | La identidad viaja como `usuarioId` en path o body.              | La API no valida esas operaciones contra una sesión. Es deuda existente, no el mecanismo a replicar en Socket.io. |
| `Frontend/package.json`                                                        | No incluye `socket.io-client`.                                   | Hay que agregarlo en la fase de implementación.                                                                   |
| `Frontend/src/`                                                                | No existe dominio de notificaciones, realtime ni bus de eventos. | Se crea desde cero siguiendo el patrón de `admin/`.                                                               |

### 3.2 Backend y Socket.io disponible

| Evidencia                                               | Estado actual                                                  | Implicancia                                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Backend/src/sockets/index.js`                          | Una única instancia `io`, inicializada con el servidor HTTP.   | El frontend debe reutilizar una única conexión.                                                  |
| `Backend/src/sockets/autenticacion.js:12-28`            | Lee exclusivamente `socket.handshake.auth.token` y valida JWT. | El handshake debe enviar `auth: { token }`. No se leen cookies.                                  |
| `Backend/src/sockets/salas.js:2-5`                      | Auto-join a `user:${tipo}:${id}` y `role:${tipo}`.             | Un cliente autenticado entra automáticamente a `user:cliente:<id>` y `role:cliente`.             |
| `Backend/src/controllers/usuarioController.js:73-79`    | El login cliente ya devuelve `token`.                          | No hace falta cambiar el backend para emitir el token, solo dejar de descartarlo en el frontend. |
| `Backend/src/notifications/canales/socketChannel.js:37` | Emite `notificacion` a las salas de destino.                   | El evento llega por la conexión única; no hay que crear salas desde el cliente.                  |
| `Backend/src/notifications/canales/socketChannel.js:50` | Emite `notificacion:leida` a `user:<tipo>:<id>`.               | Permite sincronizar lecturas entre pestañas.                                                     |
| `Backend/src/routes/notificacionRoutes.js:10`           | Todo el router usa `esAdminJwt`.                               | El cliente no puede consumir `/notificaciones` hoy.                                              |
| `Backend/src/controllers/notificacionController.js`     | Fija `destinatarioTipo: 'admin'` y `TIPOS_ADMIN`.              | Falta un contrato cliente con `destinatarioTipo: 'cliente'` y sus tipos.                         |

### 3.3 Eventos que el backend ya produce

Según `Backend/src/notifications/destinatarios.js`:

| Tipo                     | Destinos actuales                                  | ¿Llega al cliente?                                         |
| ------------------------ | -------------------------------------------------- | ---------------------------------------------------------- |
| `pedido.creado`          | Cliente dueño, admins de sucursal, sala del pedido | Sí, a `user:cliente:<usuarioId>`.                          |
| `pedido.estado_cambiado` | Cliente dueño y sala del pedido                    | Sí, a `user:cliente:<usuarioId>`.                          |
| `sucursal.cerrada`       | Clientes de la sucursal, admins de la sucursal     | Sí, a `user:cliente:<id>` de cada cliente de esa sucursal. |
| `stock.bajo`             | Solo admins de la sucursal                         | No.                                                        |

Observación de contrato: `PLAN_ADMIN_NOTIFICACIONES_2.md` documenta que el cliente no recibe `sucursal.cerrada`, pero el código actual sí lo envía a `clientesSucursal`. La Parte 1 asume el comportamiento real del código; si producto decide excluirlo, el backend debe dejar de fan-out a clientes y el mapper del frontend lo ignora sin cambiar la arquitectura.

### 3.4 Brechas detectadas

| ID  | Brecha                                                                  | Resolución en este plan                                    |
| --- | ----------------------------------------------------------------------- | ---------------------------------------------------------- |
| G1  | El token del cliente se descarta al iniciar sesión.                     | Persistir y exponer token en `AuthContext`.                |
| G2  | `httpClient` no envía `Authorization`.                                  | Adjuntar Bearer desde un único lugar.                      |
| G3  | No existe cliente Socket.io en `Frontend/`.                             | Singleton `socketClient.ts` + provider de infraestructura. |
| G4  | No existe bus de eventos desacoplado.                                   | `realtimeBus.ts` tipado.                                   |
| G5  | El backend no expone notificaciones para clientes.                      | Prerrequisito backend documentado en la sección 10.        |
| G6  | No hay normalización de payloads de socket.                             | Mappers puros con guards, sin `any`.                       |
| G7  | El objeto `user` puede quedar sin token tras una versión anterior.      | Invalidar sesiones incompletas y limpiar storage.          |
| G8  | El payload de socket incluye `destinos` con IDs de otros destinatarios. | El frontend lo ignora y se recomienda omitirlo en backend. |

---

## 4. Decisiones de arquitectura base

1. **Fuente de identidad:** JWT del login, persistido y expuesto por `AuthContext`. El `user.id` local nunca autoriza; solo se usa para presentación.
2. **Un socket por sesión:** una instancia única, creada y destruida desde un solo módulo.
3. **Handshake sin cookies:** `auth: { token }`, alineado con `autenticarSocket`.
4. **Salas automáticas:** el backend deriva `user:cliente:<id>` del JWT. El frontend no emite joins de notificaciones.
5. **Bus desacoplado:** Socket.io publica eventos de infraestructura; el dominio de notificaciones consume el bus.
6. **Capas estrictas:** tipos en `types/`, REST en `services/`, transformaciones puras en `utils/`, socket/bus en `realtime/`, estado en `context/`, lógica reutilizable en `hooks/`.
7. **Sin polling:** REST solo para carga inicial, paginación y revalidación al reconectar.
8. **Paginación por cursor:** sin offsets ni cálculo de posición en el frontend.
9. **Cursor defensivo:** se normaliza antes de enviarlo y ante `CURSOR_INVALIDO` se descarta y se recarga la primera página.
10. **Providers separados:** estado y acciones en contextos distintos para limitar renders.
11. **Cero acoplamiento con `admin/`:** no se importan tipos ni utilidades del panel.
12. **Cero `any`:** payloads externos entran como `unknown` y se validan con type guards.

---

## 5. Identidad y sesión del cliente

### 5.1 Contrato de login

El backend ya responde:

```ts
interface RespuestaLoginCliente {
  id: number;
  nombre: string;
  email: string;
  token: string;
}
```

El frontend debe tipar esa respuesta y convertirla a:

```ts
interface SesionCliente {
  user: User;
  token: string;
}
```

No se acepta una sesión sin token.

### 5.2 Persistencia

Claves:

- `user`: objeto público del cliente, sin token.
- `token`: JWT del cliente.

Reglas:

- `guardarSesion(user, token)` valida que el token no sea vacío.
- `leerSesion()` devuelve una sesión válida solo si existen `user` y `token`.
- `leerToken()` lee exclusivamente la clave `token`.
- `limpiarSesion()` elimina ambas claves.
- Si existe `user` pero no `token`, la sesión se considera inválida y se limpia. Esto invalida una única vez las sesiones creadas por la versión anterior.
- El token no se escribe en logs, toasts, mensajes de error ni estado global fuera de `AuthContext`.

### 5.3 Flujo de autenticación

```txt
login()
  -> POST /usuario/login
  -> validar token no vacío
  -> guardar user + token
  -> actualizar AuthContext

logout()
  -> desconectar socket
  -> limpiar bus
  -> limpiar user + token
  -> actualizar AuthContext
```

El registro no inicia sesión; se mantiene el comportamiento actual.

### 5.4 Identidad en REST

El `httpClient` existente será el único punto que agregue el header:

```ts
Authorization: Bearer<token>;
```

Reglas:

- Si no hay token, no se agrega el header.
- Los endpoints públicos ignoran el header; no se crea un segundo cliente HTTP.
- Los errores se normalizan a `ErrorApi` con `status` y `codigo`, preservando el mensaje actual.
- Un `401` en un endpoint autenticado debe disparar el cierre de sesión coordinado, igual que en `admin/`.
- No se usa `credentials: 'include'` como mecanismo de identidad del cliente: el backend actual no setea cookie para clientes.

### 5.5 Identidad en Socket.io

```ts
io(API_URL, {
  autoConnect: false,
  auth: { token },
});
```

Reglas:

- El token proviene de `AuthContext`/`leerToken()`, nunca de `user.id`.
- No se envía el token por query string ni headers manuales.
- No se hace `socket.emit('join', ...)` para notificaciones.
- El servidor resuelve `tipo: 'cliente'` desde el JWT y une a `user:cliente:<id>`.
- Si el handshake falla con `AUTH_REQUIRED`, `AUTH_INVALID` o `AUTH_EXPIRED`, se cierra la sesión local y no se reintenta con el mismo token.

---

## 6. Estructura de capas

```txt
Frontend/src/
├── types/
│   ├── notificacion.types.ts
│   ├── realtime.types.ts
│   └── sesion.types.ts
├── services/
│   ├── httpClient.ts                 # modificar: Bearer + ErrorApi
│   ├── authService.ts                # modificar: devolver token
│   └── notificacionService.ts        # nuevo: REST tipado
├── utils/
│   ├── sesion.ts                     # nuevo: storage de sesión
│   └── notificaciones/
│       ├── mapearNotificacion.ts
│       ├── normalizarEventoLeida.ts
│       ├── normalizarCursor.ts
│       └── urlNotificaciones.ts
├── realtime/
│   ├── socketClient.ts
│   ├── realtimeBus.ts
│   └── realtimeEvents.ts
├── context/
│   ├── AuthContext.tsx               # modificar: token + logout coordinado
│   ├── realtime/
│   │   ├── RealtimeContext.tsx
│   │   └── RealtimeProvider.tsx
│   └── notificaciones/
│       ├── NotificacionContext.tsx
│       ├── NotificacionProvider.tsx
│       └── notificacionReducer.ts
├── hooks/
│   ├── useSocketNotificaciones.ts
│   └── useReconexionNotificaciones.ts
└── components/
    └── notificaciones/               # se detalla en Parte 2
```

### 6.1 Responsabilidades

| Archivo                                           | Responsabilidad única                                 |
| ------------------------------------------------- | ----------------------------------------------------- |
| `types/notificacion.types.ts`                     | DTO remoto, modelo normalizado, acciones y estado.    |
| `types/realtime.types.ts`                         | Eventos del bus y estado de conexión.                 |
| `types/sesion.types.ts`                           | Respuesta de login y sesión persistida.               |
| `services/notificacionService.ts`                 | Llamadas REST tipadas. Sin estado React.              |
| `utils/notificaciones/mapearNotificacion.ts`      | Validar y normalizar payloads de REST y socket.       |
| `utils/notificaciones/normalizarEventoLeida.ts`   | Validar `notificacion:leida`.                         |
| `utils/notificaciones/normalizarCursor.ts`        | Descartar cursores vacíos o inválidos.                |
| `utils/notificaciones/urlNotificaciones.ts`       | Construir URLs y query strings.                       |
| `utils/sesion.ts`                                 | Persistencia de usuario y token.                      |
| `realtime/socketClient.ts`                        | Único módulo que importa `socket.io-client`.          |
| `realtime/realtimeBus.ts`                         | Publicación/suscripción tipada. Sin React.            |
| `realtime/realtimeEvents.ts`                      | Normalizar eventos de infraestructura.                |
| `context/realtime/RealtimeProvider.tsx`           | Ciclo de vida de la conexión y publicación en el bus. |
| `context/notificaciones/notificacionReducer.ts`   | Transiciones puras.                                   |
| `context/notificaciones/NotificacionProvider.tsx` | Composition root: REST + bus + acciones.              |
| `hooks/useSocketNotificaciones.ts`                | Puente entre bus y acciones del dominio.              |

---

## 7. Contratos de integración

### 7.1 REST del cliente

El router actual `/notificaciones` es exclusivamente admin. Para no romper ese contrato, se propone un namespace explícito:

| Método  | Ruta                                                | Uso              | Respuesta                         |
| ------- | --------------------------------------------------- | ---------------- | --------------------------------- |
| `GET`   | `/notificaciones/cliente?limite=8`                  | Primera página   | `{ items, siguienteCursor }`      |
| `GET`   | `/notificaciones/cliente?limite=5&antesDe=<cursor>` | Página anterior  | `{ items, siguienteCursor }`      |
| `GET`   | `/notificaciones/cliente/no-leidas/count`           | Contador inicial | `{ cantidad: number }`            |
| `PATCH` | `/notificaciones/cliente/:id/leida`                 | Marcar una       | `{ ok, notificacionId, leidaEn }` |
| `PATCH` | `/notificaciones/cliente/leer-todas`                | Marcar todas     | `{ ok, cantidad, leidaEn }`       |

Reglas:

- Todas las llamadas llevan `Authorization: Bearer <token>`.
- `limite` es un entero entre 1 y 100; el frontend usa valores fijos.
- La primera carga no envía `antesDe`.
- Las páginas siguientes envían el `siguienteCursor` vigente.
- El cursor inválido responde `400 { code: 'CURSOR_INVALIDO' }`.
- En el frontend, `urlNotificaciones.ts` concentra las rutas. Si backend prefiere un `/notificaciones` con autenticación por rol, solo se cambia ese archivo.
- No se crea un endpoint para el título de la pestaña; se deriva del contador.

### 7.2 Paginación

- `LIMITE_INICIAL = 8`.
- `LIMITE_VER_MAS = 5`.
- No se usa offset.
- Si el backend devuelve `siguienteCursor: null`, no hay más páginas.
- `normalizarCursor` descarta `''`, `'null'`, `'undefined'`, espacios y valores no string.
- Ante `CURSOR_INVALIDO`: se descarta el cursor, se conserva lo visible y se recarga la primera página.

### 7.3 Socket.io

Eventos entrantes relevantes:

| Evento               | Payload                                                    | Tratamiento                                            |
| -------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| `notificacion`       | Envelope del backend                                       | Normalizar y deduplicar por `id`.                      |
| `notificacion:leida` | `{ notificacionId, leidaEn }` o `{ todas: true, leidaEn }` | Sincronizar lecturas de forma idempotente.             |
| `connect`            | —                                                          | Estado `conectado`; al reconectar, revalidar contador. |
| `disconnect`         | Motivo estándar                                            | Estado `desconectado` o `reconectando`.                |
| `connect_error`      | `AUTH_REQUIRED`, `AUTH_INVALID`, `AUTH_EXPIRED`            | Cerrar sesión local; no reintentar con token inválido. |
| `reconnect_attempt`  | —                                                          | Estado `reconectando`.                                 |

No se consumen eventos administrativos (`admin:refresco`) ni eventos de stock.

### 7.4 Envelope de notificación

El backend persiste y emite:

```ts
interface NotificacionRemota {
  id: number;
  tipo: string;
  version: number;
  ocurridoEn: string;
  datos: unknown;
  destinos?: unknown;
  leida?: boolean;
  leidaEn?: string | null;
}
```

Reglas del frontend:

- `items` de REST deben incluir `leida` y `leidaEn`.
- Un evento de socket no incluye `leida`; el mapper lo normaliza a `false`.
- `destinos` se ignora por completo.
- `version` debe ser `1`; si no, se descarta.
- Los payloads con tipos o datos inválidos se descartan sin romper el render.

### 7.5 Tipos de notificación del cliente

```ts
type TipoNotificacionCliente =
  | "pedido.creado"
  | "pedido.estado_cambiado"
  | "sucursal.cerrada";
```

`stock.bajo` se descarta si llegara por error. El cliente no tiene una pantalla de stock.

Matriz:

| Tipo                     | Origen                  | Persistencia  | Uso                              |
| ------------------------ | ----------------------- | ------------- | -------------------------------- |
| `pedido.creado`          | Creación del pedido     | Sí            | Confirmación y bandeja.          |
| `pedido.estado_cambiado` | Cambio de estado        | Sí            | Seguimiento del pedido.          |
| `sucursal.cerrada`       | Baja/cierre de sucursal | Sí            | Aviso al cliente de la sucursal. |
| `stock.bajo`             | Stock                   | Sí para admin | Ignorado por el cliente.         |

### 7.6 Salas

- Notificaciones: `user:cliente:<id>`, auto-join desde el backend.
- `role:cliente`: disponible para futuros avisos masivos, no se usa en esta fase.
- `sucursal:<id>` y `pedido:<id>`: quedan disponibles para seguimiento, fuera del alcance de esta parte.
- El frontend no solicita unirse a ninguna de estas salas para notificaciones.

---

## 8. Modelo de dominio y estado

### 8.1 Tipos estrictos

```ts
interface DatosPedidoCreado {
  pedidoId: number;
  usuarioId: number;
  sucursalId: number;
  estadoAnterior: null;
  estado: string;
  total: number;
  fecha: string;
}

interface DatosPedidoEstadoCambiado {
  pedidoId: number;
  usuarioId: number;
  sucursalId: number;
  estadoAnterior: string | null;
  estado: string;
  total: number;
  fecha: string;
}

interface DatosSucursalCerrada {
  sucursalId: number;
  sucursalNombre: string;
}
```

El modelo normalizado se discrimina por `tipo`:

```ts
type NotificacionCliente =
  | (BaseNotificacion & { tipo: "pedido.creado"; datos: DatosPedidoCreado })
  | (BaseNotificacion & {
      tipo: "pedido.estado_cambiado";
      datos: DatosPedidoEstadoCambiado;
    })
  | (BaseNotificacion & {
      tipo: "sucursal.cerrada";
      datos: DatosSucursalCerrada;
    });
```

`BaseNotificacion` incluye `id`, `version`, `ocurridoEn`, `leida` y `leidaEn`.

### 8.2 Mapeo

`mapearNotificacion(valor: unknown)`:

- Verifica que sea un registro.
- Valida `id` entero positivo.
- Valida `version === 1`.
- Valida `tipo` contra la lista del cliente.
- Valida `ocurridoEn` como fecha ISO.
- Valida cada `datos` según el tipo.
- Normaliza `leida` a booleano y `leidaEn` a ISO o `null`.
- Ignora `destinos`.
- Devuelve `null` si algo mínimo no cumple.

Sin `as` inseguros sobre el payload completo. Los type guards construyen el objeto final.

### 8.3 Forma del estado

```ts
interface EstadoNotificacionesCliente {
  items: NotificacionCliente[];
  noLeidas: number | null;
  siguienteCursor: string | null;
  cargandoInicial: boolean;
  cargandoMas: boolean;
  marcandoTodas: boolean;
  error: string | null;
  hayMas: boolean;
  noLeidasAlMarcarTodas: number | null;
  marcaMarcarTodas: string | null;
}
```

Decisiones:

- `noLeidas` es independiente de `items` porque la lista es paginada.
- `null` significa "no conocido"; no se muestra un número inventado.
- `siguienteCursor` es la única fuente de paginación.
- El estado no se persiste en `localStorage`.

### 8.4 Acciones del reducer

- `CARGA_INICIAL_INICIO`, `CARGA_INICIAL_OK`, `CARGA_INICIAL_ERROR`.
- `CARGA_MAS_INICIO`, `CARGA_MAS_OK`, `CARGA_MAS_ERROR`.
- `CURSOR_DESCARTADO`.
- `NUEVA_NOTIFICACION`.
- `LECTURA_LOCAL_OPTIMISTA`, `LECTURA_LOCAL_REVERTIR`.
- `LECTURA_REMOTA`.
- `MARCAR_TODAS_INICIO`, `MARCAR_TODAS_OK`, `MARCAR_TODAS_ERROR`.
- `CONTADOR_ACTUALIZADO`.
- `ERROR_ACTUALIZADO`.

### 8.5 Reglas de concurrencia

1. Insertar por `id` es idempotente.
2. `NUEVA_NOTIFICACION` incrementa el contador solo si el `id` no existía.
3. Marcar leída dos veces no descuenta dos veces.
4. Un evento remoto de lectura no duplica el descuento local.
5. "Marcar todas" conserva el valor de no leídas al iniciar.
6. Las notificaciones que llegan durante "Marcar todas" siguen no leídas.
7. El evento `todas` usa `leidaEn` como límite; no borra llegadas posteriores.
8. Si falla una lectura optimista, se revierte solo si la marca de esa petición sigue vigente.
9. Si falla "Marcar todas", no se altera lectura ni contador.
10. Un error de carga adicional conserva ítems y cursor anterior.
11. Al reconectar se revalida el contador por REST.

---

## 9. Realtime

### 9.1 `socketClient.ts`

Único módulo que importa `socket.io-client`.

Responsabilidades:

- Crear la instancia con `autoConnect: false`.
- Reutilizarla si el token no cambió.
- Destruir la anterior si el token cambió.
- Exponer `obtenerSocketCliente(token)` y `desconectarSocketCliente()`.
- No registrar listeners de dominio.
- No exponer la instancia a componentes.
- Ser idempotente para soportar React StrictMode.

### 9.2 `realtimeBus.ts`

```ts
type OyenteRealtimeCliente = (evento: EventoRealtimeCliente) => void;
```

- `suscribirEventoRealtime(oyente): () => void`.
- `publicarEventoRealtime(evento)`.
- `limpiarBusRealtime()`.
- Cada oyente se aísla con `try/catch` para que un fallo no corte a los demás.
- Sin estado React y sin lógica de notificaciones.

### 9.3 `realtimeEvents.ts`

Normaliza eventos de infraestructura:

```ts
type EventoRealtimeCliente =
  | { tipo: "notificacion"; payload: unknown }
  | { tipo: "notificacion:leida"; payload: unknown }
  | { tipo: "conexion"; estado: EstadoConexionCliente }
  | { tipo: "reconexion" };
```

El payload de dominio queda como `unknown`; lo valida el mapper de notificaciones. Así el bus no conoce reglas de negocio.

### 9.4 `RealtimeProvider`

- Consume `token` de `AuthContext`.
- Si no hay token: estado `desconectado`, sin socket.
- Obtiene la instancia, registra listeners y recién después conecta.
- Publica en el bus los eventos `notificacion`, `notificacion:leida`, `conexion` y `reconexion`.
- En `connect_error` de autenticación, delega el cierre de sesión en `AuthContext`.
- En `disconnect` distingue cierre manual de reconexión.
- No desconecta en cada render.
- Limpia listeners en el cleanup.
- `desconectarSocketCliente()` debe ser idempotente.
- No crea un segundo socket si el provider se re-monta por StrictMode.

### 9.5 `NotificacionProvider`

Es un composition root, no un componente visual.

Al montar con token:

1. Ejecuta en paralelo la primera página y el contador.
2. Se suscribe al bus.
3. Registra acciones memoizadas.

Acciones:

- `cargarMas()`.
- `marcarLeida(id)`.
- `marcarTodas()`.
- `reintentar()`.

En `reconexion`: revalida el contador. No recarga toda la lista automáticamente salvo que el estado esté vacío.

### 9.6 Ubicación de providers

```txt
AuthProvider
└── RealtimeProvider          # socket único, sin dominio
    └── ToastProvider
        └── NotificacionProvider   # REST + bus + reducer
            └── App
```

- `RealtimeProvider` debe sobrevivir a la navegación.
- `NotificacionProvider` no abre socket si no hay token.
- El logout desconecta antes de limpiar `localStorage`.
- No se monta un provider de notificaciones dentro de una página o del navbar.

### 9.7 Prohibiciones

- No abrir sockets en componentes, páginas o hooks de UI.
- No hacer polling con `setInterval`.
- No crear un socket por pestaña lógica ni por panel.
- No escuchar `notificacion` directamente en componentes.
- No duplicar listeners al re-renderizar.
- No usar `any` para el payload del socket.

---

## 10. Prerrequisitos de backend

La Parte 1 del frontend queda bloqueada para integración real hasta que exista:

1. **Middleware de cliente** para notificaciones. Ya existe `autenticarUsuario` en `Backend/src/middleware/autenticacion.js`; se reutiliza.
2. **Router cliente** con `destinatarioTipo: 'cliente'`.
3. **Tipos del cliente** en el controlador: `pedido.creado`, `pedido.estado_cambiado` y, según producto, `sucursal.cerrada`.
4. **Namespace acordado:** recomendado `/notificaciones/cliente`. Si se opta por `/notificaciones` con rol, el cambio queda aislado en `urlNotificaciones.ts`.
5. **Respuestas compatibles:** `{ items, siguienteCursor }`, `{ cantidad }` y `{ ok, leidaEn }`.
6. **CORS:** `http://localhost:5173` ya está permitido.
7. **Decisión de producto sobre `sucursal.cerrada`:** el código actual lo envía a clientes de la sucursal; el plan admin documenta lo contrario.
8. **Recomendación de privacidad:** omitir `destinos` del payload emitido a clientes. El frontend ya lo ignora, pero reduce exposición de IDs.

Criterio de habilitación: un cliente autenticado obtiene 200 en su primera página y recibe `notificacion` en `user:cliente:<id>` sin unirse manualmente a salas.

---

## 11. Fases de implementación de la Parte 1

### Fase 0 — Contrato y baseline

- Confirmar endpoints cliente con backend.
- Confirmar tipos de notificación visibles para el cliente.
- Verificar `SECRET_JWT_TOKEN` y el login cliente.
- Baseline: `npm run lint`, `npm run build` y tests actuales.
- Instalar `socket.io-client` en `Frontend/`.

Criterio: contrato cerrado y build base verde.

### Fase 1 — Sesión y HTTP

- Crear `types/sesion.types.ts`.
- Crear `utils/sesion.ts`.
- Modificar `authService.ts` para devolver `{ user, token }`.
- Modificar `AuthContext` para exponer `token`, validar sesión completa y coordinar logout.
- Modificar `httpClient` para Bearer y `ErrorApi`.
- Invalidar sesiones antiguas sin token.
- Actualizar `useCerrarSesion` para desconectar socket antes de limpiar.

Criterio: tras login existe `localStorage.token`; una recarga restaura usuario y token; sin token no hay socket.

### Fase 2 — Tipos, mappers y servicio REST

- Crear tipos de notificación y realtime.
- Crear mappers puros y normalizador de cursor.
- Crear `notificacionService.ts`.
- Tests unitarios de mappers, cursor y URL.

Criterio: payloads inválidos devuelven `null`; no hay `any`; lint y build pasan.

### Fase 3 — Realtime

- Crear `socketClient.ts`.
- Crear `realtimeBus.ts`.
- Crear `realtimeEvents.ts`.
- Crear `RealtimeProvider` y su contexto.
- Integrar el provider en `main.tsx`/árbol de providers.

Criterio: una sola conexión por token, listeners sin duplicados en StrictMode y logout con desconexión.

### Fase 4 — Estado y provider de notificaciones

- Crear `notificacionReducer.ts`.
- Crear `NotificacionContext.tsx`.
- Crear `NotificacionProvider.tsx`.
- Crear `useSocketNotificaciones.ts` y `useReconexionNotificaciones.ts`.
- Tests unitarios del reducer.

Criterio: una notificación simulada aparece una sola vez, el contador se actualiza una sola vez y el cursor inválido se recupera.

### Fase 5 — Verificación de base

- `npm run lint`.
- `npm run build`.
- `npm test`.
- Smoke manual con backend real: login, socket, evento simulado, reconexión y logout.

Criterio: base estable sin UI de bandeja.

---

## 12. Verificación y criterios de calidad

### 12.1 Automática

Desde `Frontend/`:

```bash
npm run lint
npm run build
npm test
```

- `build` ejecuta `tsc -b` y valida tipos.
- Los tests cubren utilities y reducer, no componentes visuales de la Parte 2.

### 12.2 Criterios técnicos

- Cero `any`.
- Cero sockets fuera de `realtime/socketClient.ts`.
- Cero polling.
- Cero importaciones desde `admin/`.
- Cero lógica REST en componentes.
- Cero `localStorage` de sesión fuera de `utils/sesion.ts`.
- Un solo provider de realtime.
- Un solo provider de notificaciones.
- Mappers puros sin acceso a red ni React.
- Reducer puro sin efectos secundarios.

### 12.3 Matriz mínima de la base

| Escenario                   | Resultado esperado                                              |
| --------------------------- | --------------------------------------------------------------- |
| Login correcto              | Guarda `user` y `token`; conecta socket.                        |
| Recarga                     | Restaura sesión y reconecta con el mismo token.                 |
| Sesión vieja sin token      | Se limpia y queda como invitado.                                |
| Token inválido en handshake | No reintenta; cierra sesión.                                    |
| Evento duplicado            | Se muestra una sola vez.                                        |
| Lectura remota              | El contador baja una sola vez.                                  |
| Reconexión                  | Revalida contador sin duplicar ítems.                           |
| Cursor inválido             | Descarta cursor y recarga la primera página.                    |
| Logout                      | Desconecta antes de limpiar storage.                            |
| Dos pestañas                | Cada una mantiene su socket y sincroniza lecturas por servidor. |

---

## 13. Riesgos y mitigaciones

| Riesgo                                    | Mitigación                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Endpoints cliente inexistentes en backend | Fase 0 bloqueante; no se simula producción con datos falsos.                                                                       |
| Sesiones antiguas sin token               | Invalidación explícita y limpieza de storage.                                                                                      |
| Token JWT en `localStorage` (riesgo XSS)  | Se acepta por el handshake actual; a futuro, ticket efímero de socket. No se agrega cookie porque el backend no la lee en sockets. |
| Socket duplicado por StrictMode           | Singleton + `autoConnect: false` + cleanup idempotente.                                                                            |
| Eventos duplicados por reconexión         | Deduplicación por `id` en el reducer.                                                                                              |
| Cursor corrupto                           | Normalización y recuperación automática.                                                                                           |
| Payload de socket con `destinos`          | El frontend lo ignora; recomendación de omitirlo en backend.                                                                       |
| Reintentos infinitos con token inválido   | `connect_error` de auth cierra sesión y no reintenta.                                                                              |
| Desfase de reloj en lecturas              | Usar `leidaEn` del servidor como fuente de verdad.                                                                                 |
| Acoplamiento con admin                    | Sin imports cruzados; contratos duplicados de forma controlada.                                                                    |

---

## 14. Definición de terminado de la Parte 1

- [ ] La identidad del socket es el JWT del cliente.
- [ ] `AuthContext` expone `token` y `user`.
- [ ] `httpClient` adjunta `Authorization: Bearer` cuando hay token.
- [ ] Existe un único `socketClient` y una única instancia por sesión.
- [ ] El bus publica eventos tipados sin lógica de dominio.
- [ ] Los mappers validan payloads sin `any`.
- [ ] El reducer deduplica, reconcilia lecturas y recupera cursores inválidos.
- [ ] El provider de notificaciones no abre socket sin token.
- [ ] El logout desconecta y limpia en el orden correcto.
- [ ] No hay polling ni sockets en componentes.
- [ ] `npm run lint`, `npm run build` y `npm test` pasan.
- [ ] El contrato REST cliente está confirmado con backend.

---

## 15. Siguiente parte

La Parte 2 cubrirá exclusivamente la capa de presentación y experiencia:

- Campana y badge en `Navbar`.
- Panel/bandeja desplegable.
- Componentes presentacionales desacoplados.
- Deep links por tipo de notificación.
- Hooks de apertura, foco, click externo y Escape.
- Responsive, textos largos y accesibilidad.
- Matriz visual y smoke end-to-end.

**No se implementará UI hasta cerrar los prerrequisitos de las secciones 5 y 10.**

---

# Parte 2: Alcance Funcional, Patrones y Ejecución por Etapas

**Estado:** plan consolidado. La escritura de código se ejecuta por compuertas.
**Regla de esta parte:** se anexa a la Parte 1 sin reemplazar ninguna decisión anterior.

---

## 16. Alcance funcional consolidado

### A. Campana de notificaciones en el menú del cliente

- La campana se integra en `Navbar` y usa el badge de no leídas.
- El panel es un popover no modal, con scroll interno acotado.
- Carga inicial por cursor y bloques adicionales con botón "Ver más".
- Marcado individual y masivo contra REST.
- Sincronización de lecturas entre pestañas por `notificacion:leida`.

### B. Factory + Strategy para alertas

- Una estrategia por tipo de notificación: `pedido.creado`, `pedido.estado_cambiado`, `sucursal.cerrada`.
- La Factory valida y construye el modelo normalizado.
- La estrategia describe el contenido y resuelve el destino.
- El render dinámico usa un registro de componentes por tipo, sin `switch` repetidos.

### C. Reactividad de la pantalla de estado del pedido

- La vista de seguimiento escucha eventos de socket del pedido.
- El estado, el historial y la barra de pasos se actualizan sin F5.
- No se agrega polling ni una segunda conexión.

### D. Deep linking desde notificaciones

- Click en una notificación de pedido:
  1. Marca leída de forma optimista.
  2. Cierra el panel.
  3. Navega a `/pedidos/<pedidoId>`.
- Si el pedido no pertenece al cliente o no existe, se muestra un estado seguro y se ofrece volver al historial.

### E. Alerta emergente de sucursal cerrada

- Si llega `sucursal.cerrada` para la sucursal de la zona actual, se dispara un toast/alert integrado con `ToastContext`.
- Se refresca el estado de la sucursal y se bloquea la confirmación de nuevos pedidos.
- No se vacía el carrito automáticamente: el cliente decide.

---

## 17. Auditoría de la capa funcional actual

| Elemento            | Evidencia                                             | Estado                                             | Implicancia                                                                                   |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Navbar escritorio   | `Frontend/src/components/layout/Navbar.tsx`           | Tiene carrito y menú de cuenta; no tiene campana.  | La campana se agrega junto al carrito.                                                        |
| Navbar mobile       | `Navbar.tsx` + `BottomNav.tsx`                        | El header muestra logo y zona; la campana no está. | Debe ser visible en mobile sin abrir el menú de cuenta.                                       |
| Toasts              | `Frontend/src/context/ToastContext.tsx` y `Toast.tsx` | Solo tienen ícono de check y un mensaje.           | Hay que agregar variante de alerta y acción opcional.                                         |
| Historial           | `Frontend/src/pages/HistorialPedidos.tsx`             | Carga una vez con `getHistorialPedidos`.           | No reacciona a cambios de estado.                                                             |
| Seguimiento         | `SeguimientoPedido.tsx`                               | Renderiza estado y horas.                          | Puede reutilizarse en una página de detalle.                                                  |
| Pedido en curso     | `PedidoEnCurso.tsx`                                   | Tarjeta de seguimiento dentro del historial.       | Es la referencia visual para el detalle.                                                      |
| Ruta de detalle     | `Frontend/src/App.tsx`                                | No existe `/pedidos/:id`.                          | Hay que crearla.                                                                              |
| Endpoint de detalle | `Backend/src/routes/pedidoRoutes.js`                  | `GET /pedido/:id` existe.                          | `obtenerPedidoId` no incluye `Sucursal` ni historial; hay que ampliarlo o usar otro contrato. |
| Estado de sucursal  | `Frontend/src/context/ZonaContext.tsx`                | Refresca por intervalo de 60 s.                    | `sucursal.cerrada` debe adelantar el refresco sin esperar el intervalo.                       |
| Socket de pedido    | Backend                                               | `notificacion` se emite también a `pedido:<id>`.   | El cliente dueño ya lo recibe por `user:cliente:<id>`; no se necesita un segundo socket.      |

### 17.1 Decisión sobre el detalle del pedido

Para el deep link se necesita una fuente de detalle confiable. Opciones:

1. **Recomendada:** `GET /pedido/:id` incluye `DetallePedidos`, `Sucursal` e `historialDeTiemposPedidos`, y valida que el pedido pertenezca al cliente autenticado.
2. Fallback temporal: usar `GET /pedido/usuario/:usuarioId` y buscar el id en el cliente.

La Parte 2 planifica la opción 1. El fallback 2 no se usa en producción porque descarga todo el historial para un solo pedido.

---

## 18. Patrón Factory + Strategy

### 18.1 Estrategia de dominio

Cada tipo implementa una interfaz común:

```ts
interface EstrategiaNotificacionCliente {
  tipo: TipoNotificacionCliente;
  crear(base: BaseNotificacion, datos: unknown): NotificacionCliente | null;
  describir(notificacion: NotificacionCliente): DescripcionNotificacion;
  obtenerDestino(notificacion: NotificacionCliente): string | null;
}
```

Estrategias concretas:

| Estrategia               | Validación                                              | Destino                               |
| ------------------------ | ------------------------------------------------------- | ------------------------------------- |
| `pedido.creado`          | `pedidoId`, `usuarioId`, `sucursalId`, `total`, `fecha` | `/pedidos/<pedidoId>`                 |
| `pedido.estado_cambiado` | Los anteriores más `estado` y `estadoAnterior`          | `/pedidos/<pedidoId>`                 |
| `sucursal.cerrada`       | `sucursalId` y `sucursalNombre`                         | `null`; se resuelve con alerta global |

### 18.2 Factory de creación

`FabricaNotificacionesCliente`:

- Mantiene un `Map<TipoNotificacionCliente, EstrategiaNotificacionCliente>`.
- `registrar(estrategia)` permite extensión sin tocar el mapper.
- `crear(payload)` valida el envelope base y delega en la estrategia.
- Devuelve `null` para tipos desconocidos o datos inválidos.
- No contiene JSX ni acceso a red.

Ventajas:

- Agregar `pago.aprobado` o `promo.disponible` solo requiere una estrategia y una entrada en el registro.
- El mapper, el reducer y la UI no crecen con condicionales por tipo.

### 18.3 Strategy de render

En la Etapa 4 se implementa un registro de componentes:

```ts
const CONTENIDO_POR_TIPO: Record<
  TipoNotificacionCliente,
  ComponentType<{ notificacion: NotificacionCliente }>
> = {
  "pedido.creado": ContenidoPedidoCreado,
  "pedido.estado_cambiado": ContenidoEstadoPedido,
  "sucursal.cerrada": ContenidoSucursalCerrada,
};
```

El panel resuelve el componente por `notificacion.tipo`. No hay `switch` de tipos dentro del listado.

### 18.4 Separación

- `utils/` contiene validación, creación, descripción y destino.
- `components/` contiene únicamente presentación.
- El dominio nunca importa React.
- La UI nunca valida payloads de socket.

---

## 19. Etapa 1 — Auditoría, Núcleo Duro y Patrones

**Compuerta:** es la única etapa que se ejecuta en esta respuesta.

### 19.1 Checklist de diagnóstico

- [x] `AuthContext` persiste usuario y token.
- [x] Login devuelve token y falla si no existe.
- [x] `httpClient` adjunta Bearer y normaliza `ErrorApi`.
- [x] `socket.io-client` existe en `Frontend/package.json`.
- [x] Existe un único `socketClient.ts`.
- [x] Existe un bus tipado y desacoplado.
- [x] Existen tipos estrictos de notificación y realtime.
- [x] Existe Factory + Strategy de dominio.
- [x] Existe servicio REST tipado para notificaciones.
- [x] `npm run lint` y `npm run build` pasan.

### 19.2 Implementación de la Etapa 1

1. **Sesión**
   - Crear `types/sesion.types.ts`.
   - Crear `utils/sesion.ts`.
   - Refactorizar `authService.login` para devolver usuario y token.
   - Refactorizar `AuthContext` para exponer `token`, validar sesión completa y persistir cambios de perfil.
   - Invalidar sesiones antiguas sin token.

2. **HTTP**
   - Mantener `httpClient` como único cliente.
   - Exportar `API_URL`.
   - Adjuntar `Authorization: Bearer` cuando haya token.
   - Agregar `ErrorApi` con `status` y `codigo`.

3. **Realtime núcleo**
   - Instalar `socket.io-client`.
   - Crear `realtime/socketClient.ts` con singleton y `autoConnect: false`.
   - Crear `realtime/realtimeBus.ts`.
   - Crear `realtime/realtimeEvents.ts` con guardas de error de autenticación.

4. **Contratos y dominio**
   - Crear `types/notificacion.types.ts`.
   - Crear `types/realtime.types.ts`.
   - Crear `utils/notificaciones/validaciones.ts`.
   - Crear `utils/notificaciones/notificacionFactory.ts` con Factory + Strategy.
   - Crear `utils/notificaciones/mapearNotificacion.ts`.
   - Crear `utils/notificaciones/mapearEventoLeida.ts`.
   - Crear `utils/notificaciones/normalizarCursor.ts`.
   - Crear `utils/notificaciones/urlNotificaciones.ts`.
   - Crear `services/notificacionService.ts`.

5. **Verificación**
   - `npm run lint`.
   - `npm run build` (`tsc -b` incluido).

### 19.3 Criterio de salida de Etapa 1

- El login guarda `token`.
- Una recarga restaura usuario y token.
- Sin token no se considera sesión autenticada.
- Los payloads inválidos no rompen el mapping.
- Factory puede crear las tres estrategias.
- El servicio REST compila con el contrato `/notificaciones/cliente`.
- Lint y build verdes.

---

## 20. Etapa 2 — Estado, Reducers y Sincronización

**No se ejecuta en esta respuesta.**

### 20.1 Contextos

- `RealtimeProvider`: socket único, estados de conexión y publicación en bus.
- `NotificacionProvider`: composición de REST, bus y reducer.
- `NotificacionEstadoContext`: solo lectura.
- `NotificacionAccionesContext`: acciones estables.

### 20.2 Reducer

- `CARGA_INICIAL_*`, `CARGA_MAS_*`, `CURSOR_DESCARTADO`.
- `NUEVA_NOTIFICACION` con deduplicación por `id`.
- `LECTURA_LOCAL_OPTIMISTA` y reversión condicional.
- `LECTURA_REMOTA` individual y `todas`.
- `MARCAR_TODAS_*` con snapshot de no leídas.
- `CONTADOR_ACTUALIZADO`.
- `ERROR_ACTUALIZADO`.

### 20.3 Sincronización

- El evento `notificacion:leida` actualiza todas las pestañas.
- El evento `todas` usa `leidaEn` como límite temporal.
- Al reconectar se revalida el contador por REST.
- No se duplican listeners ni se abre un segundo socket.
- El cursor inválido recarga la primera página sin perder ítems.

### 20.4 Criterio de salida

- Una notificación simulada incrementa el badge una sola vez.
- Marcar leída dos veces no descuenta dos veces.
- Dos pestañas convergen sin polling.

---

## 21. Etapa 3 — Reactividad de Pedidos, Deep Linking y Alertas

**No se ejecuta en esta respuesta.**

### 21.1 Reactividad de la pantalla de estado

- Crear una página de detalle en `/pedidos/:id`.
- Cargar el pedido por REST al montar.
- Suscribirse al bus de notificaciones y filtrar `pedido.estado_cambiado` y `pedido.creado` por `pedidoId`.
- Actualizar estado e historial en memoria con el payload del evento.
- Actualizar `HistorialPedidos` cuando la página está abierta.
- Si el evento llega antes que la carga REST, se aplica al resolver la carga.
- No se requiere `pedido:suscribir` para notificaciones porque el cliente dueño ya recibe su sala `user:cliente:<id>`.

### 21.2 Deep linking

- `pedido.creado` y `pedido.estado_cambiado` resuelven `/pedidos/<pedidoId>`.
- Click en la notificación:
  1. `marcarLeida(id)` optimista.
  2. Cerrar panel.
  3. `navigate(destino)`.
- Si el pedido no existe o no pertenece al usuario, mostrar estado seguro con link a `/historial`.
- El click no debe disparar dos veces la navegación ni dejar el panel abierto.

### 21.3 Alerta de sucursal cerrada

- Extender `ToastContext` con variantes (`exito`, `alerta`) y una acción opcional.
- Al recibir `sucursal.cerrada`:
  - Si coincide con `zona.sucursalId`, mostrar alerta persistente con acción "Cambiar dirección".
  - Refrescar sucursales mediante un método expuesto por `ZonaContext`.
  - Actualizar `sucursalAbierta` a `false`.
  - No vaciar el carrito.
- Si la sucursal no coincide con la zona, la notificación queda solo en la bandeja.
- Evitar alertas repetidas por reconexión usando el `id` de notificación.

### 21.4 Criterio de salida

- Un cambio de estado del backend se ve sin F5.
- Click en notificación de pedido navega al detalle correcto.
- Cierre de la sucursal de la zona muestra alerta y bloquea checkout.
- No se abre un segundo socket.

---

## 22. Etapa 4 — UI/UX, Accesibilidad y Mobile

**No se ejecuta en esta respuesta.**

### 22.1 Ubicación de la campana

- Desktop: en `Navbar`, entre el carrito y el menú de cuenta.
- Mobile: en el header, visible junto a la zona y sin depender del menú de cuenta.
- Área táctil mínima de 44 px.
- `aria-label` dinámico: "Notificaciones, N sin leer".
- `aria-expanded` y `aria-controls`.

### 22.2 Popover

- No modal; no bloquea el scroll general en desktop.
- Desktop: ancho cercano a `24rem`, anclado a la campana.
- Mobile: hoja fija debajo del header, dentro del viewport.
- `max-height` en el panel, no en los ítems.
- Lista con scroll propio.
- Cerrar con click externo y Escape; devolver foco a la campana.

### 22.3 Contenido

- Encabezado con título, contador y "Marcar todas".
- Estados de carga, vacío, error y reintento.
- Ítems con estrategia de contenido por tipo.
- Botón "Ver más" solo si `siguienteCursor !== null`.
- Sin `truncate`, `line-clamp`, alturas fijas ni `overflow-hidden` sobre texto.
- `break-words` y `[overflow-wrap:anywhere]`.

### 22.4 Accesibilidad y responsive

- Navegación por teclado completa.
- `aria-live` para el contador o estado del panel.
- Contraste y foco visibles.
- Sin scroll horizontal desde 320 px.
- El panel no tapa el botón de menú mobile.
- Textos largos de sucursal, insumo o estado deben envolver correctamente.

### 22.5 Criterio de salida

- Campana visible en desktop y mobile.
- Popover usable a 320 px y sin recortes.
- Acciones individuales y masivas accesibles.
- Sin errores de hidratación, foco perdido ni listeners duplicados.

---

## 23. Matriz de compuertas

| Etapa | Entregable                                          | Verificación                     | Se ejecuta ahora |
| ----- | --------------------------------------------------- | -------------------------------- | ---------------- |
| 1     | Núcleo, sesión, socket, bus, Factory/Strategy, REST | Lint + build                     | **Sí**           |
| 2     | Providers, reducer, sincronización                  | Lint + build + tests unitarios   | No               |
| 3     | Detalle de pedido, deep link, alerta de sucursal    | Lint + build + smoke con backend | No               |
| 4     | Navbar, popover, responsive, ARIA                   | Lint + build + matriz manual     | No               |

No se avanza a la Etapa 2 hasta que la Etapa 1 cierre con lint y build en verde.

---

## 24. Definición de terminado consolidada

- [ ] La identidad del socket es el token del cliente.
- [ ] La campana muestra el contador real del backend.
- [ ] El panel carga por cursor y pagina con "Ver más".
- [ ] Marcar leída y marcar todas son idempotentes.
- [ ] Las lecturas se sincronizan entre pestañas.
- [ ] Factory + Strategy permite agregar tipos sin modificar el panel.
- [ ] La pantalla de pedido se actualiza en tiempo real.
- [ ] El deep link abre `/pedidos/<id>` y marca leída.
- [ ] La sucursal cerrada dispara alerta y refresca la zona.
- [ ] Mobile desde 320 px sin scroll horizontal ni texto cortado.
- [ ] No hay polling, sockets paralelos ni lógica REST en componentes.
- [ ] `npm run lint` y `npm run build` pasan.

---

## 25. Ejecución autorizada de esta respuesta

Se ejecuta exclusivamente la **Etapa 1**:

- Auditoría y checklist.
- Sesión con token.
- `httpClient` con Bearer y `ErrorApi`.
- Singleton Socket.io y bus.
- Tipos, Factory + Strategy y servicio REST.
- Verificación con `npm run lint` y `npm run build`.

Las etapas 2, 3 y 4 quedan planificadas y bloqueadas hasta una nueva instrucción.

---

## 26. Reglas de Control de Calidad — Endurecimiento de Etapa 1

**Estado:** anexado incremental. Se conservan las secciones 1–25.

### 26.1 Manejo global de HTTP 401

- `httpClient` expone `suscribirSesionExpirada`.
- Ante cualquier respuesta con `status === 401`, el cliente notifica a los suscriptores antes de lanzar `ErrorApi`.
- `AuthContext` se suscribe al montar y ejecuta de forma sincrónica:
  1. `desconectarSocketCliente`.
  2. `limpiarBusRealtime`.
  3. `limpiarSesion`.
  4. Limpieza de `user` y `token` en estado.
- La limpieza es idempotente: varios `401` simultáneos no generan bucles ni efectos duplicados.
- Ningún `401` queda aislado en el `fetch` ni permite reintentos autenticados silenciosos.
- Criterio de aceptación: una petición con token inválido deja la app sin sesión local y con el socket desconectado.

### 26.2 Aislamiento absoluto del Bus de Eventos

- Cada listener de `realtimeBus` se ejecuta dentro de su propio `try/catch`.
- El error de un listener se registra y no interrumpe la ejecución de los demás.
- La publicación itera sobre una copia de los suscriptores para evitar mutaciones durante el despacho.
- Criterio de aceptación: un listener que lanza una excepción no impide que los siguientes reciban el evento.

### 26.3 Validación estricta de fechas

- `fechaIso` comprueba explícitamente que `Date.parse` devuelva un valor numérico válido; en caso contrario devuelve `null`.
- `mapearNotificacion` valida `ocurridoEn` y, cuando existe, `leidaEn`.
- Si `ocurridoEn` es inválido, la notificación se descarta.
- Si `leidaEn` existe pero es inválido, la notificación se descarta.
- `leidaEn: null` sigue siendo un estado válido para notificaciones no leídas.
- Criterio de aceptación: una fecha corrupta nunca llega al reducer ni al renderizado de la UI.

### 26.4 Verificación

- `npm run lint`.
- `npm run build` (`tsc -b`).
- No se habilita la Etapa 2 hasta que ambas verificaciones pasen.

---

## 27. Ejecución de Etapa 2

**Estado:** implementada. Se conservan las secciones 1–26.

### 27.1 Entregables

- `RealtimeProvider`: socket único, estados de conexión, reconexión, eventos de notificación y cierre por error de autenticación.
- `NotificacionProvider`: carga inicial, contador, paginación, marcado individual y masivo, sincronización de lecturas y revalidación al reconectar.
- `notificacionReducer`: estado puro con deduplicación, orden estable, lectura optimista reversible, corte temporal al marcar todas y reinicio de sesión.
- `NotificacionContext`: separación entre estado y acciones.
- `main.tsx`: `RealtimeProvider` y `NotificacionProvider` montados bajo `AuthProvider`.

### 27.2 Controles de seguridad y consistencia

- El estado se reinicia cuando cambia el token y al cerrar sesión.
- Las respuestas asíncronas se descartan si el token cambió durante la carga.
- Los errores `401` no generan dispatch de error: los absorbe el cierre global de sesión.
- La suscripción al bus se renueva al cambiar el token para sobrevivir a `limpiarBusRealtime`.
- El bus se limpia al desmontar `RealtimeProvider`.

### 27.3 Verificación

- `npm run lint`: pasa, solo con warnings preexistentes.
- `npm run build` (`tsc -b`): pasa.
- Tests nuevos: `notificacionReducer`, `mapearNotificacion` y aislamiento de `realtimeBus` — 13/13.
- La suite completa conserva un fallo preexistente en `gruposCatalogo.test.ts`, ajeno a notificaciones.

### 27.4 Bloqueo vigente

- La integración runtime con el backend sigue pendiente hasta que existan los endpoints `/notificaciones/cliente`.
- La Etapa 3 no se inicia hasta resolver ese contrato o habilitar un entorno mock.

---

## 28. Ejecuci�n de Etapa 3

**Estado:** implementada. Se conservan las secciones 1�27.

### 28.1 Backend habilitado

- `notificacionClienteController`: lista con cursor, contador y marcado individual/masivo para `destinatarioTipo: cliente`.
- Filtro fijo por `pedido.creado`, `pedido.estado_cambiado` y `sucursal.cerrada`.
- `GET /pedido/cliente/:id` autenticado con `autenticarUsuario`; filtra por `id` y `usuarioId`, incluye detalle, sucursal e historial.
- Montaje de `/notificaciones/cliente` antes de `/notificaciones` para evitar colisiones.

### 28.2 Reactividad y deep link

- P�gina `/pedidos/:id` con carga REST, reintento y estado seguro con enlace a `/historial`.
- Suscripci�n al bus por `pedidoId`; el estado y el historial se actualizan sin F5.
- Los eventos que llegan antes de la carga REST se aplican al resolverla.
- `HistorialPedidos` refresca ante `pedido.creado` y aplica cambios de estado en memoria.
- `pedido.creado` y `pedido.estado_cambiado` ya resuelven `/pedidos/<pedidoId>` desde la Factory.
- La navegaci�n al hacer click en la notificaci�n queda para la Etapa 4, cuando exista el panel/campana.

### 28.3 Alerta de sucursal cerrada

- `ToastContext` admite variantes `exito`/`alerta`, duraci�n y acci�n opcional.
- `ZonaContext` expone `refrescarSucursales` y `marcarSucursalCerrada`.
- El cierre notificado es autoritativo: no lo revierte el temporizador de horario hasta cerrar sesi�n o recargar.
- `AlertasNotificaciones` muestra la alerta solo para la sucursal de la zona, deduplica por `id` y ofrece �Cambiar zona�.
- No se vac�a el carrito; el checkout queda bloqueado por `sucursalAbierta === false`.

### 28.4 Verificaci�n

- `npm run lint` (Frontend): pasa, solo warnings preexistentes.
- `npm run build` (Frontend): pasa.
- Tests focalizados Frontend: 16/16.
- Suite completa Frontend: 173/174; �nico fallo preexistente en `gruposCatalogo.test.ts`.
- Tests Backend focalizados: 43/43 en `notificacionClienteController` y `pedidoController`.
- Suite completa Backend: 870/870 en 67 suites.
- `node --check` sobre controladores, rutas y `main.js`: pasa.
- Sin sockets adicionales: se reutiliza el bus y el socket �nico de Etapa 2.

### 28.5 Deuda expl�cita

- Integrar el click de la notificaci�n con `marcarLeida`, cierre del panel y `navigate(destino)` al construir la UI de Etapa 4. **Resuelta en §29.**

---

## 29. Ejecución de Etapa 4

**Estado:** implementada. Se conservan las secciones 1–28.

### 29.1 Campana y ubicación

- Campana visible en escritorio entre el carrito y el menú de cuenta.
- Campana visible en mobile en el header, junto al selector de zona.
- Ambas instancias comparten el estado de `NotificacionProvider`; no abren sockets ni listeners globales adicionales.
- Área táctil de 44 px, `aria-label` dinámico, `aria-expanded`, `aria-controls` y `aria-haspopup`.
- Badge con el contador real y representación `9+` cuando supera 9.

### 29.2 Panel

- Popover no modal en escritorio, anclado a la campana y con ancho cercano a 24 rem.
- Hoja fija debajo del header en mobile, con márgenes laterales y altura máxima relativa al viewport.
- La lista tiene scroll propio; el texto no usa `truncate`, `line-clamp`, alturas fijas ni `overflow-hidden`.
- Encabezado con título, contador accesible, “Marcar todas” y cierre explícito.
- Estados de carga inicial, vacío, error con reintento y “Ver más” solo con cursor.
- Cierre por click externo, Escape, cambio de ruta y acción de la campana.
- Escape y click externo devuelven el foco a la campana.

### 29.3 Contenido y deep link

- Cada ítem usa la Factory/Strategy para título, detalle, tono e icono.
- Textos largos envuelven con `break-words` y `[overflow-wrap:anywhere]`.
- Click en una notificación de pedido: `marcarLeida` optimista, cierre del panel y `navigate(/pedidos/<id>)`.
- Click en una notificación sin destino cierra el panel y devuelve el foco.
- No se dispara dos veces la navegación ni queda el panel abierto.

### 29.4 Verificación

- `npm run build` (Frontend): pasa.
- `npm run lint` (Frontend): pasa, solo con warnings preexistentes.
- El cierre por cambio de ruta se resuelve remontando la campana con `key={pathname}`.
- Tests nuevos de `CampanaNotificaciones`: 7/7.
- Tests focalizados de notificaciones de Etapa 3: 16/16.
- Suite completa Frontend: 180/181; único fallo preexistente en `gruposCatalogo.test.ts`.
- No se agregaron dependencias ni listeners de socket.

---

## 30. Refinamiento UI/UX Mobile

**Estado:** implementado. Se conservan las secciones 1–29.

### 30.1 Header y colapso a 320 px

- En `ZoneButton`, por debajo de 360 px la pastilla de entrega se reduce a un botón cuadrado de 44 px con el icono del pin.
- El texto de dirección y el chevron se ocultan con `max-[360px]:hidden`; la calle queda limitada a `max-w-[90px] truncate` cuando hay espacio para texto.
- Se agrega `aria-label` dinámico para que el botón siga siendo comprensible sin texto visible.
- La campana conserva su área táctil de 44 px.

### 30.2 Cabecera compacta del panel

- Cabecera de una sola línea con altura fija `h-12`.
- Contenido: título, badge de no leídas, acción discreta “Marcar leídas” y cierre con icono.
- Se eliminaron los textos de estado (“Estás al día”, “Actualizando…”, etc.).
- La acción masiva conserva estado deshabilitado y spinner durante la petición.

### 30.3 Lista y paginación por scroll

- Se eliminó el botón masivo “Ver más”.
- La lista es el contenedor de scroll con `max-h-[65vh]` y `lg:max-h-[420px]`.
- La siguiente página se solicita con `IntersectionObserver` cuando el centinela del pie entra en el área visible, usando la lista como `root`.
- El pie solo muestra un spinner minimalista y texto accesible para lectores de pantalla.
- Se evita solicitar varias páginas seguidas con una bandera local y se corta la observación si hay error.
- Las tarjetas se compactaron (icono de 36 px, padding reducido, tipografía ajustada) para mostrar 3–4 notificaciones simultáneas en 320 px.

### 30.4 Verificación

- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.
- Tests de `CampanaNotificaciones`: 7/7, incluida la carga por scroll con `IntersectionObserver` simulado.
- El smoke visual manual en navegador real a 320 px queda pendiente.

---

## 31. Backdrop y bloqueo de interacción externa

**Estado:** implementado. Se conservan las secciones 1–30.

### 31.1 Capa de fondo

- Con el panel abierto se renderiza un backdrop `fixed inset-0 z-40`, transparente con un velo leve `bg-brand-dark/10`.
- El backdrop cubre todo el viewport y captura clics y gestos fuera del popover.
- El popover sube a `z-50` para quedar siempre por encima del backdrop.
- El header pasa a `z-40` mientras contiene al backdrop, para que la capa quede por encima de la navegación inferior y del botón de subir.

### 31.2 Cierre y bloqueo de interacción

- Un clic o tap sobre el backdrop ejecuta `cerrarPanel()` y devuelve el foco a la campana.
- Mientras el panel está abierto, `document.body.style.overflow = 'hidden'` bloquea el scroll de la página.
- El backdrop usa `touch-none` y `overscroll-none` para evitar gestos táctiles y scroll por rebote en los bordes.
- La lista interna conserva su propio scroll con `overscroll-contain`; el bloqueo aplica solo a la página de atrás.
- Al cerrar, desmontar o navegar se restaura el valor previo de `overflow`.

### 31.3 Verificación

- Tests de `CampanaNotificaciones`: 8/8, incluidos el cierre por backdrop y la restauración del scroll.
- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.

---

## 32. Corrección de scroll con rueda y anclaje del popover

**Estado:** implementado. Se conservan las secciones 1–31.

### 32.1 Aislamiento de la lista interna

- La lista de notificaciones usa `overscroll-y-contain` para que el scroll llegue solo hasta su tope o fondo sin encadenarse con el documento.
- El contenedor conserva `overflow-y-auto` y `overscroll-contain` funcional mediante `overscroll-y-contain`.

### 32.2 Captura de la rueda en el backdrop

- El backdrop expone una `ref` y registra un listener nativo de `wheel`.
- El listener ejecuta `preventDefault()` y `stopPropagation()`.
- Se registra con `{ passive: false }` para habilitar `preventDefault()` sin advertencias del navegador.
- El listener se elimina al cerrar el panel.

### 32.3 Anclaje del popover

- En mobile el panel usa `position: fixed` relativo al viewport.
- En escritorio el panel también pasa a `fixed` y calcula `top`/`right` desde el rectángulo de la campana al abrir y al redimensionar la ventana.
- El cálculo usa `clientWidth` y el borde derecho del botón, por lo que el panel permanece alineado aunque cambie el ancho útil del viewport.
- Se conserva un fallback CSS anclado al header sticky para el primer render antes de medir.
- Con el documento bloqueado y la rueda capturada, ningún scroll puede desplazar la página ni desalinear el panel.

### 32.4 Verificación

- Tests de `CampanaNotificaciones`: 9/9, incluido el bloqueo de `wheel` con `defaultPrevented` y sin propagación al documento.
- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.

---

## 33. Protección integral de la rueda en el popover

**Estado:** implementado. Se conservan las secciones 1–32.

### 33.1 Interceptor en el contenedor raíz

- El listener nativo de `wheel` se registra tanto en el backdrop como en el contenedor raíz del popover.
- El contenedor raíz expone `panelRef`, por lo que el header, el bloque de error y cualquier zona del panel quedan cubiertos.
- El evento se registra con `{ passive: false }` y ejecuta `preventDefault()` y `stopPropagation()` cuando no pertenece a la lista interna.
- La limpieza elimina el listener de ambos nodos al cerrar el panel.

### 33.2 Guard para la lista interna

- Si el objetivo del evento está dentro de la lista de notificaciones, el interceptor no cancela el evento.
- La lista conserva su scroll normal y `overscroll-y-contain` sigue evitando el encadenamiento en los extremos.
- De este modo se bloquea el header sin romper la navegación por rueda dentro de las notificaciones.

### 33.3 Verificación

- Tests de `CampanaNotificaciones`: 11/11, incluidos el bloqueo sobre el header y la rueda permitida sobre la lista.
- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.

---

## 34. Cambio de Paradigma UI/UX Mobile: Vista Full-Screen (Pantalla Completa)

**Estado:** implementado. Se conservan intactas las secciones 1–33.

### 34.1 Declaración de obsolescencia

- Los parches de bloqueo de scroll chaining sobre el popover flotante móvil documentados en §32 y §33 quedan oficialmente obsoletos para pantallas móviles reducidas (`< sm`, menor a 640 px).
- La experiencia con desplegables superpuestos en 320 px generaba fricción de interacción de fondo y riesgos de scroll fantasma.
- Las secciones §32 y §33 se conservan como registro histórico y siguen siendo válidas para el popover de escritorio.

### 34.2 Nuevo paradigma full-screen

- En mobile (`< sm`) el panel se renderiza como una vista de pantalla completa: `fixed inset-0 z-50 flex flex-col bg-neutral-900`.
- La vista cubre todo el viewport, usa `overscroll-none` en la raíz y no renderiza backdrop en mobile.
- El documento mantiene `overflow: hidden` mientras el panel está abierto, reforzando el aislamiento.
- Al ocupar toda la pantalla, se elimina la superposición con la página principal y cualquier riesgo de scroll fantasma.

### 34.3 Estructura mobile

- Header superior limpio de altura táctil (`h-16`), con título "Notificaciones", contador de no leídas, acción "Marcar todas" y botón de cierre de 44 × 44 px.
- El botón de cierre usa el ícono `X` y mantiene `aria-label="Cerrar notificaciones"`.
- La lista ocupa el espacio restante con `min-h-0 flex-1 overflow-y-auto overscroll-contain`.
- El scroll interno es propio y fluido; se agrega padding inferior para despejar el borde de la pantalla.

### 34.4 Desktop preservado

- En pantallas `>= sm` se mantiene el popover flotante anclado a la campana.
- El panel conserva `position: fixed`, ancho `w-96`, máximo de altura `70dvh`, borde, fondo crema y sombra.
- El anclaje se calcula desde el rectángulo de la campana al abrir y al redimensionar, usando 640 px como nuevo breakpoint de modo.
- El backdrop y el cierre por clic fuera se conservan exclusivamente en escritorio.

### 34.5 Interceptores simplificados

- El interceptor nativo de `wheel` queda limitado al modo escritorio y solo se registra cuando existe anclaje.
- En mobile no se agregan interceptores de rueda: el aislamiento absoluto de la vista full-screen y el bloqueo de `body` son suficientes.
- La lista interna conserva su comportamiento de scroll en ambos modos.

### 34.6 Verificación

- Tests de `CampanaNotificaciones`: 12/12, incluidos el renderizado full-screen mobile, la ausencia de backdrop en mobile, el cierre desde el header y la conservación del popover desktop.
- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.

---

## 35. Bloqueo del scroll táctil en el header del panel de notificaciones

**Estado:** implementado. Se conservan intactas las secciones 1–34.

### 35.1 Control táctil por CSS

- El bloque superior del panel expone `headerRef` y agrega la clase `touch-none`, equivalente a `touch-action: none`.
- La propiedad se aplica al contenedor raíz del header que agrupa el título "Notificaciones", el contador, la acción "Marcar todas" y el botón de cierre.
- El header deja de iniciar gestos de arrastre o scroll táctil, sin afectar los botones que contiene.

### 35.2 Listener explícito de `touchmove`

- Mientras el panel está abierto se registra un listener nativo de `touchmove` directamente sobre `headerRef`.
- El listener se registra con `{ passive: false }` y ejecuta `preventDefault()` y `stopPropagation()`.
- El listener se elimina al cerrar o desmontar el panel.

### 35.3 Alcance acotado

- El bloqueo aplica exclusivamente al header; la lista de notificaciones no recibe el listener.
- La lista conserva `overflow-y-auto` y `overscroll-contain`, por lo que su scroll táctil sigue funcionando con normalidad.
- La corrección aplica tanto a la vista full-screen mobile como al popover de escritorio.

### 35.4 Verificación

- Tests de `CampanaNotificaciones`: 14/14, incluidos el bloqueo de `touchmove` sobre el header y la propagación permitida sobre la lista.
- `npm run build` (`tsc -b`): pasa.
- `npm run lint`: pasa, solo con warnings preexistentes.

---
