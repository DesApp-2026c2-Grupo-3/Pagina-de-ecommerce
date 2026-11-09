# Plan de Notificaciones del Panel de Administración

## 1. Objetivo

Implementar en `admin/` el sistema de notificaciones en tiempo real para administradores:

- Campana con contador de no leídas.
- Bandeja desplegable con historial.
- Soporte para pedidos, cambios de estado, cierre de sucursal y stock bajo.
- Sincronización de lectura entre pestañas mediante Socket.io.
- Marcado individual y masivo contra la API REST.
- Desconexión explícita del socket al cerrar sesión.

Este documento es exclusivamente de planificación. No autoriza todavía la escritura de componentes, servicios ni cambios de código.

## 2. Diagnóstico del panel actual

La implementación debe partir del código real de `admin/src/`, no de una estructura ideal:

| Elemento | Estado actual | Implicancia |
|---|---|---|
| `NavBar.tsx` | Es una barra lateral; no existe topbar ni campana. | Hay que incorporar una franja superior estable dentro del navbar, visible también con el menú móvil cerrado. |
| `AuthContext.tsx` | Solo guarda `administrador`; no conserva ni expone token. | Debe refactorizarse antes de conectar Socket.io. |
| `services/authService.ts` | Tipa el login como `AdministradorSesion` y descarta el `token` que ya devuelve el backend. | Debe devolver un contrato explícito con administrador y token. |
| `pages/Home.tsx` | Reconstruye manualmente la sesión y llama a `iniciarSesion(sesion)`. | Debe dejar de duplicar el mapeo y delegar en el contexto. |
| `utils/sesion.ts` | Usa solo la clave `administrador`; no administra `token`. | Debe incorporar la clave exacta `token` y limpiar ambas de forma conjunta. |
| `services/httpClient.ts` | Centraliza REST con cookies y `credentials: 'include'`. | Se mantiene para REST; el token local se usa exclusivamente para el handshake de Socket.io. |
| `package.json` | No incluye `socket.io-client`. | Hay que agregar la dependencia. |
| `index.css` | Tailwind v4 con tokens `action`, `danger`, `success`, `secondary`. | La UI debe usar esos tokens y la paleta naranja/gris existente. |
| `AdminLayout.tsx` | No tiene cabecera superior. | El navbar puede aportar una franja sticky sin crear una ruta ni una página nueva. |
| Estado global | Context API y hooks locales; no hay librería de estado. | Usar `useReducer` + Context, sin agregar Zustand/Redux. |
| Tests | El panel no tiene runner de tests. | La verificación base será lint, build y matriz manual; la lógica pura queda aislada para tests futuros. |

### 2.1 Estado del backend como dependencia

Según `planes/notificacion/PLAN_NOTIFICACIONES.md`, el backend diseña:

- Fase 4: núcleo de notificaciones y canal Socket.io.
- Fase 5: autenticación y salas de Socket.io.
- Fase 7: bandeja HTTP y emisión de `notificacion:leida`.

En el checkout actual del backend solo está implementada la Fase 3. Por lo tanto, la integración real del panel queda condicionada a que existan los endpoints y eventos de las fases 4, 5 y 7. La UI puede construirse contra los contratos definidos acá, pero no debe declararse terminada hasta validarlos contra el backend real.

## 3. Principios obligatorios

1. **Cero legacy:** no se conservan sesiones sin token, no se aceptan dos formas del mismo DTO y no se agregan fallbacks para estructuras anteriores.
2. **Una responsabilidad por archivo:** un hook no mezcla conexión, estado de dominio y presentación; un componente no llama directamente a `fetch` ni crea sockets.
3. **Fuente única de verdad:** el backend es la fuente de las notificaciones; el frontend mantiene una copia normalizada y deduplicada.
4. **Separación de capas:** tipos en `types/`, REST en `services/`, formateo/mapeo en `utils/`, sockets y contexto en `hooks/` y `context/`, visual en `components/`.
5. **Reactividad explícita:** toda mutación local de lectura debe ser idempotente y reconciliable con el evento de Socket.io.
6. **Rendimiento:** el contador no se deriva de una lista paginada; el estado y las acciones se exponen en contextos separados para reducir renders.
7. **Sin truncamiento:** prohibido `truncate`, `text-ellipsis`, `line-clamp`, alturas fijas por ítem o cualquier estrategia que oculte texto. El panel puede scrollear; el contenido de cada notificación debe crecer.
8. **Errores de red sí, compatibilidad no:** se permiten estados de error, reintento y rollback; no se permiten adaptadores para formatos viejos.

## 4. Contratos de integración

### 4.1 REST

Todos los endpoints se consumen con `apiFetch` existente, conservando cookies para la API. No se agrega un cliente HTTP paralelo.

| Método | Ruta | Uso | Respuesta esperada |
|---|---|---|---|
| `GET` | `/notificaciones?limite=20&offset=0` | Historial paginado del administrador autenticado | `NotificacionRemota[]` |
| `GET` | `/notificaciones/no-leidas/count` | Contador inicial del badge | `{ cantidad: number }` |
| `PATCH` | `/notificaciones/:id/leida` | Marcar una notificación como leída | `200`; el body no se usa |
| `PATCH` | `/notificaciones/leer-todas` | Marcar todas como leídas | `200`; el body no se usa |

Reglas:

- `limite` y `offset` son números; el frontend envía `limite=20` y controla el offset de servidor por separado.
- El identificador de la notificación es el `id` del envelope, no el id de la fila destinatario.
- Los errores mantienen el formato existente `{ mensaje, code }` y `apiFetch` los convierte en `ErrorApi`.
- Si el backend todavía no expone `{ cantidad }` en el contador, se ajusta únicamente el mapper del servicio antes de integrar. No se aceptan dos formatos simultáneos.

### 4.2 Socket.io

Conexión al mismo origen del backend, usando `API_URL` como base y sin cookies en el handshake:

```ts
auth: { token: localStorage.getItem('token') }
```

No se permite leer el token de cookies, query string, headers ni de otra clave de storage.

Eventos entrantes:

| Evento | Payload | Tratamiento |
|---|---|---|
| `notificacion` | Envelope del backend | Se normaliza como no leída y se inserta con deduplicación por `id`. |
| `notificacion:leida` | `{ notificacionId, leidaEn }` o `{ todas: true, leidaEn }` | Sincroniza lecturas realizadas en otra pestaña. Debe ser idempotente. |
| `connect_error` | `AUTH_REQUIRED` / `AUTH_INVALID` | Se cierra la sesión local; no se reintenta con un token inválido. |
| `disconnect` | Motivo estándar | Se refleja como estado de conexión; la reconexión automática queda a cargo de `socket.io-client`. |

Contrato mínimo de `notificacion:leida` a fijar con backend en Fase 7:

```ts
type EventoNotificacionLeida =
  | { notificacionId: number; leidaEn: string }
  | { todas: true; leidaEn: string }
```

El evento `todas` es necesario para sincronizar el botón "Marcar todas" entre pestañas sin emitir N eventos.

### 4.3 Evento de stock bajo

`PLAN_NOTIFICACIONES.md` define pedidos y cierre de sucursal, pero el requerimiento del panel exige stock bajo. Se debe acordar y agregar en el backend:

```ts
{
  tipo: 'stock.bajo',
  datos: {
    sucursalId: number
    sucursalNombre: string
    insumoId: number
    insumoNombre: string
    cantidad: number
    stockMinimo: number | null
  }
}
```

La UI soporta el tipo, pero no inventa datos: si un payload no trae los nombres requeridos, se muestra el identificador disponible (`Sucursal #2`, `Insumo #8`) sin romper el render.

## 5. Modelo de dominio del frontend

### 5.1 Tipos

Crear `admin/src/types/notificacion.types.ts` con:

- `TipoNotificacion`: `'pedido.creado' | 'pedido.estado_cambiado' | 'sucursal.cerrada' | 'stock.bajo'`.
- `NotificacionRemota`: espejo del DTO del backend, incluyendo `leida` y `leidaEn`.
- `Notificacion`: modelo normalizado que consume la UI, sin `destinos` ni campos que no se usan.
- `DatosPedidoCreado`, `DatosPedidoEstadoCambiado`, `DatosSucursalCerrada`, `DatosStockBajo`.
- `EventoNotificacionLeida`.
- `EstadoNotificaciones` y `AccionesNotificaciones`.

El modelo normalizado debe ser discriminado por `tipo` para que el render de textos no dependa de accesos inseguros a `datos`.

### 5.2 Normalización

`admin/src/utils/notificaciones/mapearNotificacion.ts`:

- Convierte `NotificacionRemota` a `Notificacion`.
- Valida campos mínimos mediante type guards propios.
- Para eventos de socket, agrega `leida: false` y `leidaEn: null`.
- No modifica nombres de campos ni acepta alias del backend.

`admin/src/utils/notificaciones/describirNotificacion.ts`:

- Devuelve título, descripción, detalle y una clave visual por tipo.
- Ejemplos:
  - Nuevo pedido: `Nuevo pedido #45` / `Sucursal Centro · $15.400`.
  - Cambio de estado: `Pedido #45 en proceso` / `Antes: Pendiente`.
  - Sucursal cerrada: `Sucursal Centro cerrada`.
  - Stock bajo: `Stock bajo: Cheddar` / `Sucursal Centro · quedan 3 (mínimo 5)`.
- No contiene JSX ni decisiones de layout.

`admin/src/utils/notificaciones/formatoNotificacion.ts`:

- Formatea fechas en `es-AR` y zona `America/Argentina/Buenos_Aires`, reutilizando el criterio visual del panel.
- Formatea importes con `toLocaleString('es-AR')`.
- Formatea contadores para el badge (`99+`).

## 6. Estructura de archivos

```txt
admin/src/
├── types/
│   └── notificacion.types.ts
├── services/
│   └── notificacionService.ts
├── utils/
│   └── notificaciones/
│       ├── mapearNotificacion.ts
│       ├── describirNotificacion.ts
│       └── formatoNotificacion.ts
├── context/
│   └── notificaciones/
│       ├── NotificacionContext.tsx
│       ├── NotificacionProvider.tsx
│       ├── notificacionReducer.ts
│       └── socketClient.ts
├── hooks/
│   ├── useSocketNotificaciones.ts
│   ├── useDesplegableNotificaciones.ts
│   └── useLogoutAdmin.ts
└── components/
    ├── NavBar.tsx                         # modificar
    └── notificaciones/
        ├── NotificacionCampana.tsx
        ├── NotificacionBadge.tsx
        ├── NotificacionPanel.tsx
        ├── NotificacionItem.tsx
        ├── NotificacionIcono.tsx
        └── NotificacionEstado.tsx
```

### 6.1 Responsabilidades

| Archivo | Responsabilidad única |
|---|---|
| `notificacionService.ts` | Llamadas REST tipadas. Ninguna gestión de estado React. |
| `mapearNotificacion.ts` | Transformar y validar DTOs. |
| `describirNotificacion.ts` | Traducir dominio a textos. |
| `formatoNotificacion.ts` | Fechas, importes y contadores. |
| `notificacionReducer.ts` | Transiciones puras del estado de notificaciones. |
| `socketClient.ts` | Crear, reutilizar y destruir la instancia de Socket.io. |
| `useSocketNotificaciones.ts` | Ciclo de vida de listeners; no renderiza ni formatea. |
| `NotificacionContext.tsx` | Definir contextos de estado/acciones y hooks de consumo. |
| `NotificacionProvider.tsx` | Composición de carga inicial, socket y acciones. Sin JSX visual. |
| `NotificacionCampana.tsx` | Botón, badge y apertura del panel. |
| `NotificacionPanel.tsx` | Layout del historial y acciones masivas. |
| `NotificacionItem.tsx` | Render de una notificación y acción individual. |
| `NotificacionIcono.tsx` | Mapeo visual tipo → icono/color. |
| `NotificacionEstado.tsx` | Estados vacío, cargando y error. |
| `useDesplegableNotificaciones.ts` | Apertura, cierre, click externo, Escape y foco. |
| `useLogoutAdmin.ts` | Orquestar logout HTTP, desconexión y limpieza local. |

## 7. Estado y reducer

### 7.1 Forma del estado

```ts
interface EstadoNotificaciones {
  items: Notificacion[]
  noLeidas: number | null
  cargandoInicial: boolean
  cargandoMas: boolean
  marcandoTodas: boolean
  error: string | null
  hayMas: boolean
  offsetRemoto: number
  conexion: 'conectando' | 'conectado' | 'reconectando' | 'desconectado'
}
```

Decisiones:

- `noLeidas` es independiente de `items` porque la lista es paginada; derivar el contador del listado sería incorrecto.
- `offsetRemoto` cuenta solo elementos traídos por REST. Los eventos nuevos de socket no lo incrementan. Así se evita saltear notificaciones al usar paginación por offset.
- `noLeidas` puede ser `null` mientras el contador inicial no se conoce o si falló. El badge no debe mostrar un número inventado.
- La lista se ordena por `ocurridoEn` descendente y se deduplica por `id`.

### 7.2 Acciones del reducer

- `CARGA_INICIAL_INICIO`, `CARGA_INICIAL_OK`, `CARGA_INICIAL_ERROR`.
- `CARGA_MAS_INICIO`, `CARGA_MAS_OK`, `CARGA_MAS_ERROR`.
- `NUEVA_NOTIFICACION`: inserta solo si el `id` no existe; incrementa `noLeidas` si llega no leída.
- `LECTURA_LOCAL_OPTIMISTA`: marca leída y decrementa solo si antes estaba no leída.
- `LECTURA_LOCAL_REVERTIR`: revierte únicamente si la marca optimista sigue vigente.
- `LECTURA_REMOTA`: aplica `notificacionId` o `todas` de forma idempotente.
- `MARCAR_TODAS_INICIO`, `MARCAR_TODAS_OK`, `MARCAR_TODAS_ERROR`.
- `CONEXION_ACTUALIZADA`, `ERROR_ACTUALIZADO`.

### 7.3 Reglas de concurrencia

1. Una notificación nunca se inserta dos veces: el socket puede reenviar o duplicar durante una reconexión.
2. Marcar una leída dos veces no descuenta dos veces.
3. Si el evento remoto confirma una lectura ya aplicada, no se modifica el contador.
4. "Marcar todas" guarda el valor de `noLeidas` al iniciar. Al confirmar, resta solo ese valor; las notificaciones nuevas que llegaron durante la petición siguen no leídas.
5. Si falla una lectura individual optimista, se revierte solo si la notificación continúa con la marca generada por esa petición.
6. Si falla "Marcar todas", no se cambia el estado de lectura ni el contador.

## 8. Capa Socket.io

### 8.1 Cliente

`context/notificaciones/socketClient.ts` será el único lugar que importa `socket.io-client`.

Responsabilidades:

- Crear la instancia con `auth: { token: localStorage.getItem('token') }`.
- Usar `autoConnect: false` para registrar listeners antes de conectar.
- Reutilizar la instancia si el token no cambió.
- Si cambia el token, destruir la instancia anterior y crear una nueva.
- Exponer `desconectarSocketNotificaciones()` para logout y expiración de sesión.

No se expone la instancia globalmente a componentes.

### 8.2 Hook de conexión

`useSocketNotificaciones.ts` recibe:

- `token`.
- `onNotificacion`.
- `onLectura`.
- `onErrorAutenticacion`.
- `onCambioConexion`.

Responsabilidades:

- Obtener la instancia desde `socketClient`.
- Registrar listeners después de crearlas.
- Conectar explícitamente.
- Limpiar listeners en el cleanup.
- No desconectar en cada re-render ni en el cleanup normal del provider; la conexión pertenece a la sesión autenticada.
- Evitar duplicados en React StrictMode usando la instancia única y handlers estables mediante refs.
- En `AUTH_REQUIRED`/`AUTH_INVALID`, cerrar la sesión local y no reintentar con el mismo token.

### 8.3 Ubicación del provider

`NotificacionProvider` se montará dentro del área protegida, envolvendo `AdminLayout`, no en `App.tsx` global:

```txt
ProtectedRoute
└── NotificacionProvider
    └── AdminLayout
        ├── NavBar
        └── Outlet
```

Así no se abre un socket durante el login y el estado de notificaciones se destruye al abandonar el área autenticada.

## 9. Refactor obligatorio de autenticación y token

Este refactor es prerrequisito de Socket.io. No se debe implementar la campana antes de completarlo.

### 9.1 `types/sesion.types.ts`

- Mantener `AdministradorSesion` como datos del administrador.
- Agregar `RespuestaLoginAdmin` con `administrador` y `token`, o el contrato equivalente acordado con el backend.
- No usar `any` para la respuesta del login.

### 9.2 `services/authService.ts`

- Tipar el retorno de `iniciarSesion` con el token incluido.
- Validar la respuesta con un type guard y fallar si falta el token.
- No descartar campos ni mapear manualmente en la página.

### 9.3 `utils/sesion.ts`

- `CLAVE_SESION = 'administrador'`.
- `CLAVE_TOKEN = 'token'`.
- `guardarSesion(administrador, token)` guarda ambos.
- `leerSesion()` devuelve una sesión válida solo si existen administrador y token.
- `leerToken()` lee exclusivamente `localStorage.getItem('token')`.
- `limpiarSesion()` elimina ambas claves.
- `notificarSesionExpirada()` deja de limpiar por su cuenta: solo emite el evento. El `AuthContext` es el único dueño de la secuencia de cierre.
- No se aceptan sesiones antiguas sin token ni estructuras parciales.

### 9.4 `AuthContext.tsx`

- Estado: `administrador` y `token`.
- `iniciarSesion` guarda administrador y token y actualiza ambos estados.
- `cerrarSesion` ejecuta, en este orden:
  1. `desconectarSocketNotificaciones()`.
  2. `limpiarSesion()`.
  3. Limpia `administrador` y `token` del estado.
- `isAuthenticated` exige administrador y token.
- El listener de sesión expirada usa la misma secuencia de cierre.
- No se guarda el token en logs, mensajes de error ni estado global fuera de `AuthContext`.

### 9.5 `pages/Home.tsx`

- Eliminar la reconstrucción manual de `AdministradorSesion`.
- Llamar a `iniciarSesion` con la respuesta tipada del servicio.
- Si falta token o la respuesta no cumple el contrato, el login falla.

### 9.6 `hooks/useLogoutAdmin.ts`

Encapsula la secuencia de logout usada por `NavBar.tsx`:

1. Intentar `cerrarSesionService()`.
2. En `finally`, ejecutar `cerrarSesion()` del contexto.
3. `cerrarSesion()` desconecta el socket antes de limpiar `localStorage`.
4. Exponer un estado `saliendo` para deshabilitar el botón y evitar dobles clics.

La UI no debe importar `socketClient` ni manipular `localStorage`.

## 10. Servicio REST

`admin/src/services/notificacionService.ts` expone únicamente:

```ts
obtenerNotificaciones({ limite, offset, leida? }): Promise<NotificacionRemota[]>
obtenerCantidadNoLeidas(): Promise<number>
marcarNotificacionLeida(id: number): Promise<void>
marcarTodasLeidas(): Promise<void>
```

Reglas:

- Usar `API_URL` y `apiFetch`.
- No construir URLs con barra doble ni hardcodear otro puerto.
- No manejar toasts ni estado React.
- No convertir errores a mensajes nuevos: se propaga `ErrorApi`.
- `obtenerCantidadNoLeidas` mapea `{ cantidad }` a `number` y valida que sea un entero no negativo.

## 11. Provider y acciones

`NotificacionProvider.tsx` es un composition root, no un componente visual.

Al montar:

1. Verifica que exista token; si no existe, no abre socket.
2. Ejecuta en paralelo `GET /notificaciones` y `GET /notificaciones/no-leidas/count`.
3. Registra los listeners de socket.
4. Expone acciones estables mediante `useCallback` y valores memoizados.

Acciones:

- `recargar()`: reintenta la carga inicial.
- `cargarMas()`: pide la siguiente página con `offsetRemoto` y marca `hayMas` según si el lote tiene tamaño completo.
- `marcarLeida(id)`: actualización optimista, llamada REST y rollback condicional.
- `marcarTodas()`: actualización optimista controlada por el valor inicial de no leídas y llamada REST.
- `cerrarSesionPorSocket()`: delega en el cierre de sesión del `AuthContext`.

Contextos:

- `NotificacionEstadoContext`: estado de solo lectura.
- `NotificacionAccionesContext`: acciones estables.
- Hooks: `useNotificacionesEstado()` y `useNotificacionesAcciones()`.

Esto evita que el badge vuelva a renderizar toda la bandeja cuando solo cambia una acción, y viceversa.

Los errores de acciones se muestran con el `ToastContext` existente. El panel conserva un estado de error propio para la carga inicial y permite reintentar.

## 12. UI/UX

### 12.1 Ubicación en el navbar

`NavBar.tsx` incorporará una franja superior sticky dentro del área de contenido, visible en desktop y mobile:

- Mantiene la barra lateral actual.
- Agrega a la derecha la campana.
- No crea una ruta nueva.
- No tapa el botón de apertura del menú móvil.
- Usa borde inferior sutil y fondo blanco semitransparente, coherente con el panel.

La campana debe estar disponible con el menú móvil cerrado. No se acepta esconderla dentro del drawer.

### 12.2 Campana y badge

`NotificacionCampana.tsx`:

- Icono `Bell`/`BellRing` de `lucide-react`.
- Área táctil mínima de 44 px.
- `aria-label` dinámico: "Notificaciones, N sin leer".
- `aria-expanded` y `aria-controls`.
- Badge flotante con `99+` cuando corresponda.
- Sin badge si el contador es `0` o `null`.
- Indicador de conexión discreto: no se muestra un banner permanente, solo un punto o texto en el panel.

`NotificacionBadge.tsx`:

- `absolute -top-1 -right-1`.
- `bg-danger`, texto blanco, `min-w-5`, altura uniforme, `rounded-full`.
- `aria-hidden` porque el contador ya se anuncia en el `aria-label` de la campana.

### 12.3 Panel desplegable

`NotificacionPanel.tsx`:

- Desktop: anclado a la campana, ancho cercano a `24rem`, máximo `calc(100vw - 2rem)`.
- Mobile: hoja fija debajo de la franja superior, ocupando el ancho disponible.
- `max-h` en el panel, no en los ítems.
- Lista con scroll vertical propio.
- Cabecera con título, contador y acción "Marcar todas".
- Pie con "Cargar más" cuando `hayMas`.
- Estados de carga, error, reintento y vacío.
- No usar `overflow-hidden` en el contenedor de texto.
- No cerrar el panel al marcar una notificación, para permitir acciones consecutivas.

Comportamiento:

- Click externo cierra.
- Escape cierra y devuelve el foco a la campana.
- Al abrir, se enfoca el primer control útil.
- No se bloquea el scroll de la página para un popover de desktop.
- En mobile, el panel debe quedar dentro del viewport y permitir scroll interno.

### 12.4 Ítem de notificación

`NotificacionItem.tsx`:

- Layout flex con icono, contenido y acción.
- Contenido con `min-w-0 flex-1`.
- Texto con `whitespace-normal`, `break-words` y `[overflow-wrap:anywhere]`.
- Sin `truncate`, sin `line-clamp`, sin altura fija.
- No leída: borde izquierdo naranja y fondo levemente cálido.
- Leída: fondo neutro, manteniendo contraste y legibilidad.
- Fecha y metadatos siempre visibles, con `flex-wrap`.
- Acción individual "Marcar como leída" solo si está no leída; botón con texto o `aria-label` explícito.
- El click en la acción no debe cerrar el panel.

`NotificacionIcono.tsx`:

- Pedido creado: `ShoppingBag`.
- Cambio de estado: `PackageCheck`.
- Sucursal cerrada: `Store`.
- Stock bajo: `TriangleAlert`.
- El color se decide por clave semántica; no se incrustan clases Tailwind en los utils.

### 12.5 Paleta y estilos

- Naranja de acción: `action` / `action-hover`.
- Rojo de alerta: `danger`.
- Verde de éxito: `success` si se usa para confirmaciones.
- Neutros: `slate`/`gray` existentes.
- No agregar colores nuevos a `@theme` salvo necesidad aprobada.
- No usar estilos inline para la UI de notificaciones.

### 12.6 Textos largos

Requisitos de aceptación:

- Nombres de sucursal, insumo, producto o estado de hasta 120 caracteres deben envolver correctamente.
- Palabras sin espacios deben partirse sin desbordar.
- En 320 px de ancho no debe aparecer scroll horizontal.
- El panel puede scrollear, pero ningún ítem debe recortar su texto.
- Las acciones no deben superponerse al contenido cuando el texto crece.

## 13. Integración con Navbar y AdminLayout

Cambios previstos:

- `NavBar.tsx`: importar `NotificacionCampana` y montarla en la nueva franja superior.
- `AdminLayout.tsx`: no necesita lógica de notificaciones; el provider se monta en `AppRoutes.tsx` alrededor de `AdminLayout`.
- `AppRoutes.tsx`: envolver el layout protegido con `NotificacionProvider`.
- No modificar páginas de pedidos o stock para esta integración.
- No agregar un botón de notificaciones en `Footer`.

Orden de render esperado:

```txt
AuthProvider
└── ToastProvider
    └── AppRoutes
        └── ProtectedRoute
            └── NotificacionProvider
                └── AdminLayout
                    ├── NavBar + NotificacionCampana
                    └── Outlet
```

## 14. Fases de ejecución

### Fase 0 — Preparación y contrato

- Confirmar con backend las Fases 4, 5 y 7.
- Acordar payload de `notificacion:leida` y `stock.bajo`.
- Instalar `socket.io-client` en `admin/`.
- Verificar baseline: `npm run lint` y `npm run build`.
- No avanzar a UI si el login no devuelve token.

Criterio: contratos cerrados y build base verde.

### Fase 1 — Token y sesión

- Refactorizar tipos de sesión, `sesion.ts`, `authService.ts`, `AuthContext.tsx` y `Home.tsx`.
- Crear `useLogoutAdmin.ts`.
- Asegurar el orden disconnect → limpiar storage.
- Verificar persistencia de sesión tras recargar.

Criterio: `localStorage.token` existe tras login y el contexto expone un token válido.

### Fase 2 — Tipos, servicio, mapeo y formato

- Crear `notificacion.types.ts`.
- Crear `notificacionService.ts`.
- Crear los tres módulos de `utils/notificaciones/`.
- Verificar que los tipos no usen `any` y que lint/build pasen.

Criterio: contratos REST tipados y DTO normalizable sin componentes.

### Fase 3 — Estado, socket y provider

- Crear `notificacionReducer.ts`.
- Crear `socketClient.ts`.
- Crear `useSocketNotificaciones.ts`.
- Crear `NotificacionContext.tsx` y `NotificacionProvider.tsx`.
- Integrar el provider en `AppRoutes.tsx`.
- Verificar deduplicación, contador y reconexión.

Criterio: una notificación simulada incrementa el badge una sola vez y el reducer no duplica.

### Fase 4 — Componentes visuales

- Crear `NotificacionBadge`, `NotificacionIcono`, `NotificacionEstado`, `NotificacionItem`, `NotificacionPanel` y `NotificacionCampana`.
- Crear `useDesplegableNotificaciones.ts`.
- Integrar la campana en `NavBar.tsx`.
- Revisar responsive, foco y textos largos.

Criterio: campana visible, panel operativo y sin truncamiento en 320 px.

### Fase 5 — Acciones y sincronización

- Implementar marcado individual y masivo.
- Implementar eventos `notificacion:leida`.
- Verificar idempotencia entre pestañas.
- Verificar rollback ante error de red.

Criterio: el contador y los ítems quedan consistentes después de acciones locales y remotas.

### Fase 6 — Logout y cierre

- Validar que `Navbar.salir` use `useLogoutAdmin`.
- Confirmar que `socket.disconnect()` se ejecuta antes de `localStorage.removeItem`.
- Confirmar que la expiración por 401 también desconecta.
- Probar cierre con panel abierto y con petición de logout fallida.

Criterio: no quedan conexiones huérfanas ni token/sesión residual.

### Fase 7 — Verificación final

- `npm run lint`.
- `npm run build`.
- Matriz manual de la sección 15.
- Smoke test contra backend real.
- Revisar que no se haya agregado lógica de negocio a componentes visuales.

## 15. Matriz de verificación

### 15.1 Automática

Desde `admin/`:

```bash
npm run lint
npm run build
```

El build ejecuta `tsc -b`, por lo que también valida TypeScript.

### 15.2 Manual

| Escenario | Resultado esperado |
|---|---|
| Login correcto | Se guardan `administrador` y `token`; el socket conecta. |
| Recarga de página | La sesión y el socket se restauran con el token guardado. |
| Token ausente o inválido | No se conecta; se cierra la sesión y se redirige al login. |
| Nueva notificación con panel cerrado | El badge aumenta una sola vez. |
| Nueva notificación duplicada | La lista mantiene un solo ítem. |
| Marcar una leída | El ítem cambia visualmente y el contador baja una vez. |
| Evento remoto de lectura | Otra pestaña refleja la lectura sin doble descuento. |
| Marcar todas | Todos los ítems actuales quedan leídos y el contador baja solo por las no leídas previas. |
| Nueva notificación durante "Marcar todas" | La nueva queda no leída. |
| Error de red al marcar | Se revierte la lectura y se informa el error. |
| Logout | Se llama al logout HTTP, se desconecta el socket y luego se limpia el storage. |
| Logout con API caída | La sesión local se limpia igualmente y el socket se desconecta. |
| Mobile 320/375 px | No hay scroll horizontal ni texto recortado. |
| Desktop 1280 px | El panel queda anclado y no se sale del viewport. |
| Texto largo | Envuelve en varias líneas; no aparece "..." ni se tapa la acción. |
| Teclado | Escape cierra, el foco vuelve a la campana y los botones son accesibles. |

## 16. Decisiones explícitas

1. **No se implementa polling REST para notificaciones.** El socket mantiene la novedad; REST solo carga historial y contador inicial.
2. **No se deriva el contador del listado.** El listado es paginado; el contador es un dato independiente.
3. **No se usa `localStorage` para el estado de notificaciones.** Solo se persisten sesión y token.
4. **No se persiste el historial localmente.** Al recargar se reconstruye desde la API.
5. **No se permiten dos conexiones activas.** El singleton de socket se reutiliza y se destruye al cambiar token.
6. **No se crea una página de notificaciones.** El alcance es campana y bandeja desplegable.
7. **No se agregan filtros ni búsqueda en esta fase.** La bandeja muestra historial reciente y carga más.
8. **No se navega automáticamente al hacer click en una notificación.** La acción definida es marcar como leída; una navegación contextual queda para otra fase.
9. **No se modifican endpoints existentes.** Solo se consumen los contratos acordados.
10. **No se introduce una librería de estado externa.** React Context + reducer es suficiente para este alcance.

## 17. Fuera de alcance

- Repartidores y sala `delivery:*`.
- Notificaciones push del navegador.
- Correo electrónico o SMS.
- Sonidos, vibración o preferencias de notificación.
- Centro de notificaciones a página completa.
- Filtros, búsqueda y agrupación por sucursal.
- Cambios en el backend fuera de los contratos de Fase 4, 5 y 7.
- Rediseño general del navbar, login o panel de pedidos.

## 18. Definición de terminado

- [ ] `localStorage.getItem('token')` es la única fuente del token para el handshake.
- [ ] El socket se conecta con `auth: { token }` y sin cookies.
- [ ] La campana es visible en desktop y mobile, incluso con el menú móvil cerrado.
- [ ] El badge refleja el contador del backend y los eventos nuevos.
- [ ] La bandeja distingue leídas y no leídas.
- [ ] Las acciones individuales y masivas son idempotentes y reactivas.
- [ ] `notificacion:leida` sincroniza lecturas entre pestañas.
- [ ] Los textos largos no se truncan ni desbordan.
- [ ] El panel es usable en 320 px y en desktop.
- [ ] El logout desconecta el socket antes de limpiar `localStorage`.
- [ ] `npm run lint` y `npm run build` pasan.
- [ ] No hay lógica REST ni Socket.io dentro de componentes visuales.
- [ ] No se agregó compatibilidad con sesiones o DTOs anteriores.
