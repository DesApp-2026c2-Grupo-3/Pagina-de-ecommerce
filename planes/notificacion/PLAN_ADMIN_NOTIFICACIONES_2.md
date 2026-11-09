# Plan v2.1 — Notificaciones y reactividad en tiempo real del Panel de Administración

> **Archivo:** `planes/notificación/PLAN_ADMIN_NOTIFICACIONES_2.md`
> **Versión:** 2.1 — revisión post-integración
> **Estado:** planificación; pendiente de aprobación
> **Fecha de revisión:** 2026-11-02
> **Alcance:** bandeja de notificaciones del admin, indicador de pestaña, criterio de stock bajo y arquitectura de refresco en tiempo real reutilizable.

**Este archivo es exclusivamente de planificación. No autoriza escribir componentes, servicios, hooks, controladores, pruebas ni modificar código funcional en `admin/src/`, `Backend/src/` ni en ninguna otra carpeta.**

---

## 0. Control de versión y alcance

### 0.1 Relación con las versiones anteriores

- `planes/notificacion/PLAN_ADMIN_NOTIFICACIONES_ADMIN.md` se conserva como historial de la primera propuesta.
- La versión 2 definió la bandeja, la paginación por cursor, la UX sin modales y la seguridad de sesión.
- Esta versión **2.1 conserva esas decisiones** y las corrige con los hallazgos de las pruebas de integración.
- La ruta del archivo mantiene la grafía solicitada `notificación`; el plan histórico vive en `notificacion`.

### 0.2 Cambios de la versión 2.1

| # | Cambio | Motivo | Impacto |
|---|---|---|---|
| 1 | El admin deja de recibir `pedido.estado_cambiado` | Ruido operativo: los cambios de estado intermedios son información del cliente | Backend, contratos, tipos y UI de admin |
| 2 | El contador de no leídas se refleja en `document.title` | El admin debe percibir actividad aun trabajando en otra pestaña | Frontend, hook de título y pruebas manuales |
| 3 | `stock.bajo` se emite solo ante un cruce dinámico del mínimo | Evitar alertas repetidas de stock que ya nació bajo y no sufrió cambios | Backend, transacciones, pruebas |
| 4 | Se agrega un bus de eventos y refresco reactivo sobre el socket existente | La tabla de stock no se actualizaba tras una venta sin recargar | Arquitectura frontend, backend de eventos y pantalla de stock |
| 5 | Se formaliza una única conexión Socket.io y un único propietario | Evitar sockets paralelos, listeners duplicados y estados divergentes | Frontend, ciclo de sesión y logout |

### 0.3 Baseline técnico de referencia

La última verificación local registrada antes de esta revisión es:

- Backend: `64` suites y `838` tests aprobados.
- Admin: `npm run build` aprobado.
- Admin: `npm run lint` sin errores; quedan advertencias preexistentes.
- Smoke test real con dos sesiones/pestañas: **pendiente**.
- Migración y base PostgreSQL real: **pendiente de verificación**.

Este baseline **no sustituye** el smoke test de aceptación ni autoriza a considerar cerrada la versión 2.1.

### 0.4 Regla de ejecución de esta sesión

1. Solo se actualiza este documento.
2. No se implementan cambios de código.
3. No se modifican `admin/src/`, `Backend/src/`, `src/` ni componentes/servicios.
4. No se crean archivos funcionales nuevos.
5. Al terminar la redacción, la ejecución se detiene para revisión y aprobación.

---

## 1. Gate de ejecución

### 1.1 Estado del gate histórico de la versión 2

La versión 2 declaraba el frontend bloqueado hasta cerrar las fases 4, 5 y 7 del backend. Ese gate se considera **cumplido funcionalmente** en el checkout actual, según el baseline de la sección 0.3, y se conserva como antecedente.

La existencia de este nuevo documento no reabre la implementación anterior: la versión 2.1 agrega un **gate de correcciones** que debe cerrarse antes de tocar la UI o la reactividad.

### 1.2 Gate obligatorio de la versión 2.1

No se inicia ninguna tarea de frontend de esta revisión hasta cumplir y verificar:

- [ ] **C1 — Filtro de pedidos del admin:** `pedido.estado_cambiado` no genera destinatarios ni eventos para administradores.
- [ ] **C1 — Compatibilidad histórica:** la bandeja y el contador del admin excluyen ese tipo aunque existan filas antiguas.
- [ ] **C1 — Cliente intacto:** el cliente sigue recibiendo los cambios de estado de sus pedidos.
- [ ] **C2 — Stock bajo dinámico:** solo se emite al cruzar el mínimo en una mutación de cantidad.
- [ ] **C2 — Sin alertas iniciales:** seeders, arranque, login, lectura de stock y configuración del mínimo no generan alertas.
- [ ] **C2 — Sin repetición:** mientras el stock permanezca en o por debajo del mínimo no se vuelve a emitir.
- [ ] **C3 — Evento de refresco:** contrato `admin:refresco` definido, emitido tras commit y limitado a salas admin.
- [ ] **C3 — Una sola conexión:** `admin:refresco` viaja por la misma conexión Socket.io que las notificaciones.
- [ ] **C3 — Tests:** cruces de stock, filtro admin, evento de refresco, salas y reconexión cubiertos.
- [ ] **Aprobación:** contratos REST, Socket y bus de eventos revisados y firmados por backend y frontend.

Si cualquiera de estos puntos falla, no se implementan las fases F8, F9 ni F10 de esta revisión. No se permiten stubs, eventos simulados localmente ni adaptaciones que oculten un backend incompleto.

### 1.3 Secuencia de cierre

```txt
C1 + C2 + C3 aprobados
        ↓
F8 Título de pestaña
        ↓
F9 Arquitectura realtime y bus
        ↓
F10 Integración de stock
        ↓
Verificación final y smoke real
```

---

## 2. Filtrado de notificaciones de pedidos para el administrador

### 2.1 Problema detectado

El administrador recibe una notificación por cada transición de estado del pedido: creación, preparación, en camino, entrega, cancelación, etc. Esa información es útil para el cliente, pero genera ruido y desplaza las alertas que el admin sí necesita atender.

El ruido además distorsiona el contador de no leídas y el futuro indicador del título de la pestaña.

### 2.2 Regla de negocio

- El administrador recibe **solo** la notificación inicial `pedido.creado` de un pedido.
- El administrador **no recibe** `pedido.estado_cambiado` en ninguna de sus variantes.
- El cliente dueño del pedido **sí sigue recibiendo** `pedido.estado_cambiado`.
- La sala del pedido `pedido:${id}` puede seguir recibiendo el evento para la vista de seguimiento del cliente.
- La regla aplica a todos los destinatarios de tipo administrador, incluidos el admin de sucursal y cualquier admin global.
- No se elimina el tipo `pedido.estado_cambiado` del contrato global del backend: solo se excluye del fan-out y de la bandeja administrativa.

### 2.3 Matriz de destinatarios por tipo

| Evento | Cliente dueño | Sala `pedido:${id}` | Admin de sucursal | Admin global | Persistencia para admin |
|---|---|---|---|---|---|
| `pedido.creado` | Sí | Sí | Sí | Sí, según alcance vigente | Sí |
| `pedido.estado_cambiado` | Sí | Sí | **No** | **No** | **No** |

Reglas adicionales:

- No se crean filas de destinatario administrador para `pedido.estado_cambiado`.
- No se emite el evento a salas `user:admin:*`, `admin:sucursal:*`, `role:admin` ni equivalentes.
- Si en el futuro se agrega una sala global de administración, la prohibición sigue aplicando.
- La creación del pedido mantiene su comportamiento actual de fan-out administrativo.

### 2.4 Cambio de contrato de destinatarios

El backend debe separar explícitamente los destinos:

- `pedido.creado` → cliente, sala del pedido y administradores que correspondan.
- `pedido.estado_cambiado` → cliente y sala del pedido únicamente.

La separación debe vivir en la capa de destinatarios/handlers, no en la UI. La UI no debe recibir el evento para luego descartarlo como única defensa.

Defensa en profundidad:

1. El handler de estado no incluye destinos admin.
2. El canal Socket no emite a salas admin para ese tipo.
3. La consulta REST del admin excluye el tipo como compatibilidad con datos históricos.
4. El mapper frontend descarta el tipo si llegara por error o por una versión anterior del backend.

### 2.5 Compatibilidad con notificaciones históricas

Pueden existir notificaciones `pedido.estado_cambiado` creadas antes de esta corrección.

Reglas:

- Las consultas `GET /notificaciones` y `GET /notificaciones/no-leidas/count` del administrador excluyen `pedido.estado_cambiado`.
- La exclusión debe aplicarse antes de paginar y antes de contar, no en el cliente.
- El cursor keyset no cambia: sigue ordenando y paginando el conjunto ya filtrado.
- No se muestran filas históricas de ese tipo en la bandeja del admin.
- La limpieza física de filas históricas es opcional y no bloquea la versión 2.1; si se hace, debe ser una tarea separada y auditable.
- Las notificaciones del cliente no se filtran ni se eliminan.

### 2.6 Contrato de UI del admin

El modelo de notificación del administrador queda limitado a:

```ts
type TipoNotificacionAdmin =
  | 'pedido.creado'
  | 'sucursal.cerrada'
  | 'stock.bajo'
```

Consecuencias:

- Se elimina `pedido.estado_cambiado` del union type de la UI admin.
- El mapper descarta cualquier payload de ese tipo sin romper el render.
- El descriptor de texto no necesita un caso para ese tipo.
- El mapa de iconos elimina `PackageCheck`; `PackageCheck` no se usa para notificaciones del admin.
- El contador y el badge no incluyen esas notificaciones.

### 2.7 Pruebas de aceptación

- Crear un pedido: el admin recibe `pedido.creado` y el contador aumenta.
- Cambiar el estado de un pedido: el admin no recibe evento, no aumenta el contador y no aparece en la bandeja.
- Cambiar el estado de un pedido: el cliente sí recibe el evento.
- Existencia de una fila histórica de estado para admin: no aparece en listado ni conteo.
- Repetir la prueba con admin de sucursal y admin global.
- Verificar que la sala `pedido:${id}` sigue funcionando para el cliente.
- Verificar que no se crean destinatarios admin para el evento suprimido.

---

## 3. Indicador de no leídas en el título de la pestaña

### 3.1 Objetivo

Que el administrador perciba la actividad aunque esté trabajando en otra pestaña o ventana del navegador, sin agregar notificaciones push, sonidos ni permisos del navegador.

### 3.2 Regla de derivación

El título se deriva **exclusivamente** de `noLeidas`, el mismo contador que alimenta la campana. No se inventa un número a partir de los ítems cargados, porque la lista es paginada.

| Estado de `noLeidas` | Título |
|---|---|
| `null` | `Panel Admin - E-commerce` |
| `0` | `Panel Admin - E-commerce` |
| `1` a `99` | `(N) Panel Admin - E-commerce` |
| `100` o más | `(99+) Panel Admin - E-commerce` |

Reglas:

- No se muestra un contador si el valor es `null`.
- El contador nunca es negativo.
- Se reutiliza la misma función de formateo del badge para el límite `99+`.
- El título se actualiza con cada cambio de `noLeidas`: evento Socket, lectura individual, lectura masiva, reconexión y recarga inicial.
- No se realiza una petición adicional solo para el título.
- El título no se actualiza si el valor calculado no cambió.

### 3.3 Propiedad y ciclo de vida

- El título tiene **un único propietario**: un hook dedicado, por ejemplo `hooks/useTituloNoLeidas.ts`.
- El hook se invoca una sola vez desde el nivel del provider de notificaciones o desde un componente de infraestructura equivalente.
- Ningún componente de la bandeja, Navbar o página debe escribir `document.title` directamente.
- El título base debe estar centralizado en una constante, por ejemplo `TITULO_PANEL = 'Panel Admin - E-commerce'`.
- Al desmontar el provider o cerrar sesión, se restaura el título base.
- Si en el futuro una ruta necesita un título propio, debe usar una función común que componga el prefijo de no leídas; no se permiten dos escritores independientes.
- El hook debe comparar el título actual antes de asignarlo para evitar mutaciones innecesarias del DOM.

### 3.4 Accesibilidad y UX

- El título de la pestaña es un refuerzo visual; el `aria-label` de la campana sigue siendo la fuente accesible principal.
- No se agrega un `aria-live` para el título.
- No se añaden animaciones, parpadeos ni cambios de favicon en esta versión.
- El título debe actualizarse aunque la pestaña esté oculta; ese es el objetivo del requerimiento.
- No se solicita permiso de notificaciones del navegador.

### 3.5 Pruebas de aceptación

- Login con `noLeidas = null`: título base.
- Contador `0`: título base.
- Contador `1`, `2`, `99`: prefijo correspondiente.
- Contador `100`: prefijo `(99+)`.
- Llega una notificación por Socket: el título aumenta sin recargar.
- Se marca una notificación: el título disminuye una sola vez.
- Se marcan todas: el título vuelve a base, preservando notificaciones nuevas posteriores.
- Otra pestaña marca lecturas: el título se sincroniza por `notificacion:leida`.
- Logout: no queda un contador residual en el título.
- Reconexión: el contador se revalida y el título converge al valor real.

---

## 4. Criterio de alertas de stock bajo

### 4.1 Regla principal: solo cruces dinámicos

La notificación `stock.bajo` representa un **cambio de estado operativo**, no una fotografía del inventario inicial.

Se emite solo cuando, dentro de una mutación de cantidad, se cumple:

```txt
minimo !== null
minimo >= 0
antes > minimo
despues <= minimo
```

Donde:

- `antes` es la cantidad de stock antes de la mutación, leída bajo lock dentro de la transacción.
- `despues` es la cantidad resultante luego de la mutación.
- `minimo` es el `stockMinimo` efectivo de la sucursal e insumo.
- La comparación usa la misma precisión y redondeo con la que se persiste el stock.

### 4.2 Fuentes que pueden disparar la alerta

- Venta/consumo de productos que descuenta stock y cruza el mínimo.
- Ajuste manual de baja que reduce la cantidad y cruza el mínimo.
- Cualquier movimiento futuro de inventario que disminuya cantidad y cumpla la transición.

### 4.3 Fuentes que no deben disparar la alerta

- Seeders, migraciones o carga inicial de datos.
- Arranque del backend.
- Login del administrador.
- Apertura o recarga de la bandeja.
- Consulta de stock.
- Configuración o cambio de `stockMinimo` sin movimiento de cantidad.
- Aumento o reposición de stock.
- Venta o ajuste que deja el stock por encima del mínimo.
- Venta o ajuste cuando el stock ya estaba en o por debajo del mínimo.
- Nuevas ventas mientras el stock sigue bajo.
- Un cambio de mínimo que, matemáticamente, deja el stock actual por debajo del nuevo umbral.

### 4.4 Interpretación de la regla

- Si el stock nació bajo por seeder y nunca se modifica, no se genera ninguna notificación nueva.
- Si el stock nació bajo y el admin solo cambia el mínimo, tampoco se genera una notificación nueva.
- La vista de stock sigue mostrando el estado `bajoMinimo` con su indicador visual; la alerta de bandeja no sustituye el estado actual del inventario.
- Las notificaciones históricas de stock bajo ya existentes se conservan y pueden aparecer en la bandeja; la regla prohíbe generar nuevas alertas sin cruce.
- Si el stock se repone por encima del mínimo y luego vuelve a cruzar hacia abajo, se genera una nueva notificación: comenzó un nuevo período de riesgo.
- No se emite una notificación de “stock recuperado” en esta versión.
- Si una operación deja el stock exactamente en el mínimo, se considera cruce y se emite.
- Si `stockMinimo` es `null` o inválido, no se emite.
- El stock en `0` con mínimo `0` se considera bajo; solo se notifica si la operación cruzó desde un valor mayor.

### 4.5 Coalescencia y consistencia transaccional

- La evaluación se hace dentro de la transacción de inventario, con lock de la fila de stock.
- La emisión se realiza **después del commit**. Si la transacción falla o se revierte, no se emite.
- Si un mismo pedido afecta varias veces al mismo insumo, se agrupa por `(sucursalId, insumoId)` y se emite una sola notificación con la cantidad final.
- Si un mismo pedido afecta varios insumos, puede emitirse una notificación por cada insumo que haya cruzado.
- Si el stock ya estaba bajo antes de la operación, no se agrega al grupo de alertas aunque la cantidad siga bajando.
- La emisión es best-effort: un fallo del socket o de la notificación no debe revertir la venta ni el ajuste ya confirmado.
- El payload no necesita recalcular el estado inicial en el frontend; la lógica de cruce vive en backend.

### 4.6 Contrato de `stock.bajo`

El payload existente se mantiene:

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

Reglas:

- `cantidad` refleja el valor final de la operación que produjo el cruce.
- `stockMinimo` es el umbral vigente al momento del cruce.
- La UI no obtiene nombres por su cuenta.
- Si un nombre falta, se usa el fallback visual `Sucursal #id` / `Insumo #id`.
- La alerta no se emite en el login ni en la carga inicial de la pantalla de stock.

### 4.7 Pruebas de aceptación

| Caso | Resultado esperado |
|---|---|
| Stock inicial bajo por seeder, sin movimientos | Sin notificación |
| Login con stock bajo preexistente | Sin notificación |
| Cambio de mínimo con stock ya bajo | Sin notificación |
| Venta desde `minimo + 1` a `minimo` | Notificación |
| Venta desde `minimo + 1` a un valor menor | Notificación |
| Venta desde `minimo` a un valor menor | Sin notificación |
| Venta desde un valor ya bajo a otro valor bajo | Sin notificación |
| Segunda venta mientras sigue bajo | Sin notificación |
| Reposición por encima del mínimo | Sin notificación de stock bajo |
| Nueva venta que cruza después de reponer | Nueva notificación |
| Ajuste manual de baja que cruza | Notificación |
| Ajuste manual de alta | Sin notificación |
| Mínimo `null` | Sin notificación |
| Mínimo `0` y cruce a `0` | Notificación |
| Rollback de la transacción | Sin notificación |
| Varios movimientos del mismo insumo en un pedido | Una sola notificación con cantidad final |
| Varios insumos afectados en un pedido | Una notificación por insumo cruzado |

---

## 5. Reactividad modular en tiempo real sobre el mismo Socket.io

### 5.1 Problema detectado

Cuando se concreta una venta, el backend descuenta stock y puede emitir `stock.bajo`, pero la tabla de stock del admin no se actualiza hasta recargar la página. La notificación de bandeja y el estado operativo de la pantalla son dos necesidades distintas.

No se debe resolver abriendo otro socket por pantalla ni agregando polling global.

### 5.2 Principios de diseño

1. **Una sola conexión:** una única instancia de Socket.io por sesión de admin.
2. **Un solo propietario:** solo el provider de infraestructura abre, autentica y cierra el socket.
3. **Eventos de dominio:** el backend publica hechos consumados, no instrucciones de UI.
4. **Desacoplamiento:** las pantallas se suscriben a eventos; no conocen `socket.io-client`.
5. **Revalidación:** el evento dispara una recarga o revalidación idempotente, no una mutación especulativa del estado local.
6. **Coalescencia:** varios eventos cercanos producen una sola recarga.
7. **Aislamiento:** el fallo de un suscriptor no afecta a los demás ni rompe la conexión.
8. **Limpieza:** toda suscripción se cancela al desmontar y al cerrar sesión.
9. **Sin bucles:** una recarga no vuelve a emitir el mismo evento.
10. **Alcance mínimo:** solo se refresca la pantalla interesada y, si corresponde, la sucursal seleccionada.

### 5.3 Arquitectura objetivo

```txt
ProtectedRoute
└── RealtimeProvider              ← único dueño de la conexión
    └── NotificacionProvider      ← estado de bandeja, contador y título
        └── AdminLayout
            ├── NavBar
            └── Outlet
                └── Stock           ← se suscribe a refrescos de stock
```

Módulos propuestos:

```txt
admin/src/
├── types/
│   ├── notificacion.types.ts
│   └── realtime.types.ts
├── services/
│   └── notificacionService.ts
├── realtime/
│   ├── socketClient.ts           ← único importador de socket.io-client
│   ├── realtimeBus.ts            ← pub/sub tipado, sin React
│   └── realtimeEvents.ts         ← normalización/validación de eventos
├── context/
│   ├── notificaciones/
│   │   ├── NotificacionContext.tsx
│   │   ├── NotificacionProvider.tsx
│   │   └── notificacionReducer.ts
│   └── realtime/
│       ├── RealtimeContext.tsx
│       └── RealtimeProvider.tsx
├── hooks/
│   ├── useTituloNoLeidas.ts
│   ├── useRefrescoEnTiempoReal.ts
│   ├── useStockEnTiempoReal.ts
│   ├── useDesplegableNotificaciones.ts
│   └── useLogoutAdmin.ts
└── components/
    ├── NavBar.tsx
    └── notificaciones/
        └── ...
```

La ruta exacta puede ajustarse durante la implementación, pero no se permite duplicar responsabilidades ni crear una segunda conexión.

### 5.4 Responsabilidades

| Módulo | Responsabilidad | No debe hacer |
|---|---|---|
| `realtime/socketClient.ts` | Instancia única, `autoConnect: false`, `auth.token`, reconexión y desconexión | Conocer React, notificaciones o stock |
| `RealtimeProvider.tsx` | Ciclo de vida de la conexión, listeners base, estado de conexión, entrega de eventos al bus | Guardar notificaciones, decidir refrescos de pantallas |
| `realtimeBus.ts` | Pub/sub tipado, suscripción/desuscripción, aislamiento de handlers | Abrir sockets, hacer fetch, contener estado React |
| `useRefrescoEnTiempoReal.ts` | Suscribirse a dominios/eventos filtrados, debounce, ejecutar callback, limpiar | Importar Socket.io, abrir conexiones |
| `useStockEnTiempoReal.ts` | Reglas específicas de la pantalla de stock y filtro por sucursal | Duplicar la infraestructura del bus |
| `NotificacionProvider.tsx` | Carga REST, reducer, contador, acciones y título | Abrir el socket, conocer la tabla de stock |
| `Stock.tsx` | Render de inventario y llamado a su recarga existente | Crear sockets, registrar listeners globales |

### 5.5 Contrato del evento `admin:refresco`

El backend emite un evento de dominio por la misma conexión Socket.io, después del commit de la operación:

```ts
type DominioRefresco =
  | 'stock'
  | 'pedidos'
  | 'productos'
  | 'sucursales'
  | 'reportes'

interface EventoRefrescoAdmin {
  version: 1
  eventoId: string
  dominio: DominioRefresco
  accion: 'creado' | 'actualizado' | 'eliminado' | 'estado_cambiado'
  ocurridoEn: string
  sucursalId: number | null
  recursos?: {
    insumoId?: number
    pedidoId?: number
    productoId?: number
  }
}
```

Reglas del contrato:

- `stock` es el primer dominio implementado.
- `sucursalId` es obligatorio para eventos de stock; `null` se reserva para eventos globales.
- `eventoId` permite deduplicar entregas repetidas.
- `version` permite evolucionar el contrato sin romper consumidores.
- El evento no contiene datos sensibles ni reemplaza la carga REST de la pantalla.
- La pantalla que lo recibe revalida su propia fuente de verdad.
- El evento no se persiste en la base de datos.
- Un evento `stock.actualizado` se emite cuando cambia la cantidad o el mínimo de stock, incluso si no se generó una notificación `stock.bajo`.
- Un evento `stock.actualizado` de una venta se emite una vez por sucursal afectada; puede incluir `insumoId` si el cambio es puntual.
- El evento se emite después del commit. Si la transacción falla, no se emite.
- El fallo al emitir el refresco no revierte la operación ni impide responder al cliente.

### 5.6 Destinos y salas

- Los eventos de stock se emiten solo a administradores.
- Para un evento de sucursal se usa la sala `admin:sucursal:${sucursalId}`.
- Para que un admin global reciba eventos de todas las sucursales se agrega una sala exclusiva, por ejemplo `admin:global`, asignada solo a administradores sin sucursal.
- **No se usa `role:admin` para eventos con alcance de sucursal**, porque los administradores de sucursal también pertenecen a esa sala y recibirían eventos de otras sucursales.
- El cliente nunca recibe `admin:refresco`.
- Las notificaciones siguen usando sus salas actuales; el nuevo evento no reemplaza ni altera `notificacion` ni `notificacion:leida`.

### 5.7 API de suscripción para pantallas

La pantalla operativa debe poder suscribirse con una superficie mínima. Ejemplo conceptual de uso, no implementación:

```ts
useRefrescoEnTiempoReal({
  dominios: ['stock'],
  sucursalId,
  debounceMs: 300,
  onRefrescar: recargar,
})
```

Reglas de la API:

- `dominios` filtra por tipo de evento.
- `sucursalId` filtra por alcance; `null` significa “todas las sucursales” solo para quien tenga permiso.
- `debounceMs` coalesce ráfagas; el valor sugerido es 250–500 ms.
- `onRefrescar` recibe el lote de eventos normalizados, ordenado del más antiguo al más nuevo, y puede ser síncrono o asíncrono.
- La API mantiene la referencia más reciente del callback para evitar cierres obsoletos.
- La suscripción se cancela al desmontar, al cambiar de filtro o al cerrar sesión.
- La API no abre sockets ni hace fetch por sí sola.
- Los eventos duplicados por `eventoId` se ignoran dentro de la ventana de coalescencia.

### 5.8 Integración inicial con la pantalla de stock

La vista de stock será el primer consumidor:

- Se suscribe solo mientras está montada.
- Filtra `dominio === 'stock'`.
- Si el admin tiene sucursal asignada, filtra por esa sucursal.
- Si el admin es global y tiene una sucursal seleccionada, filtra por la selección.
- Si el admin global ve “todas”, acepta eventos de cualquier sucursal y coalesce una sola recarga.
- Usa la función de recarga existente; no se duplica la lógica de fetch.
- Una ráfaga de ventas produce una sola recarga.
- Si ya hay una recarga en curso, se encola una sola revalidación posterior; no se lanzan fetches paralelos.
- Si el usuario está editando una fila, no se sobrescribe el formulario; se marca la pantalla como desactualizada y se refresca al cerrar la edición.
- No se muestra un toast ni un sonido por cada evento; como máximo, un indicador discreto de “Actualizado”.
- Al reconectar el socket, se revalida la pantalla para recuperar eventos perdidos.
- Si la pestaña estuvo oculta, se puede revalidar al volver a ser visible.

### 5.9 Una sola conexión: reglas de infraestructura

- `socketClient.ts` es el único módulo que importa `socket.io-client`.
- `RealtimeProvider` es el único que solicita/crea la instancia y registra los listeners base.
- `NotificacionProvider` consume eventos del bus, no del socket.
- Ningún componente de página, Navbar, panel o tabla importa `socket.io-client`.
- No se crea un segundo namespace, una segunda URL ni un socket “de stock”.
- Cambiar el token destruye la instancia anterior y crea una nueva con el token vigente.
- El logout desconecta y destruye la instancia antes de limpiar el storage.
- El bus se limpia al desmontar; los handlers no deben sobrevivir al cierre de sesión.
- StrictMode no debe producir listeners duplicados ni dos conexiones.
- Un handler que lanza una excepción no debe impedir que los demás reciban el evento.

### 5.10 Reconexión y recuperación

- Al reconectar, el provider vuelve a publicar el estado de conexión y solicita una revalidación del contador de no leídas.
- La pantalla de stock revalida al reconectar.
- Los eventos perdidos durante la desconexión no se reproducen; se recuperan mediante la revalidación REST.
- La UI no debe mostrar datos como “en vivo” si la conexión está caída sin indicarlo; el indicador de conexión puede ser discreto.
- No se implementa una cola offline de eventos en esta versión.

### 5.11 Pruebas de aceptación

- Una venta actualiza la tabla de stock sin recargar la página.
- La misma venta que cruza el mínimo genera `stock.bajo` y `admin:refresco` de forma independiente.
- Una venta que no cruza el mínimo no genera `stock.bajo`, pero sí refresca la tabla.
- Un ajuste manual de stock refresca las demás pestañas.
- Cambiar el mínimo refresca la tabla, pero no genera `stock.bajo` si no hubo cruce por movimiento.
- Una ráfaga de ventas produce una sola recarga en la pantalla.
- Un admin de sucursal no recibe refrescos de otra sucursal.
- Un admin global recibe refrescos de todas las sucursales.
- El cliente no recibe `admin:refresco`.
- Al desmontar la pantalla de stock, la suscripción se cancela.
- Al cerrar sesión, no queda conexión ni suscripción activa.
- Al reconectar, la pantalla se revalida.
- Solo existe una conexión Socket.io durante toda la sesión; se verifica con instrumentación de pruebas o logs controlados sin exponer tokens.

---

## 6. UX/UI de la bandeja

### 6.1 Decisión: disclosure nativo, no modal

La bandeja **no será**:

- Un modal.
- Un bottom sheet.
- Una hoja flotante inferior.
- Un overlay con fondo oscuro.
- Un contenedor con scroll interno forzado.
- Una superficie con altura fija por ítem.

La bandeja será un **disclosure/popover no modal** integrado al navbar:

- Desktop: dropdown anclado visualmente a la campana, con altura natural.
- Mobile: panel inline debajo de la barra superior, dentro del flujo normal del documento.
- El scroll lo maneja la página, no un contenedor anidado.
- No hay backdrop ni bloqueo del scroll del documento.
- No hay focus trap; el usuario puede tabular fuera del panel.

### 6.2 Barra superior sin sticky

- La franja que contiene la campana se ubica al inicio del área de contenido, en flujo normal.
- No será sticky.
- El panel puede crecer y la página conserva su scroll natural.
- No se recorta el panel con `overflow-hidden` en el navbar, el layout ni la franja.
- No se agrega `max-height` al panel ni a los ítems.
- Si el contenido supera el viewport, el usuario baja con el scroll del documento.

### 6.3 Textos largos

Queda prohibido:

- `truncate`.
- `text-ellipsis`.
- `line-clamp-*`.
- `overflow-hidden` sobre el texto.
- Alturas fijas por notificación.
- `white-space: nowrap` en descripciones.
- Puntos suspensivos manuales.

Obligatorio:

- `min-w-0` en el contenedor flexible.
- `flex-1` en el bloque de texto.
- `whitespace-normal`.
- `break-words`.
- `[overflow-wrap:anywhere]` para identificadores o nombres sin espacios.
- Altura automática según contenido.
- Acciones que se reubican debajo o al costado sin tapar el texto.

### 6.4 Paginación visual sin scroll anidado

- Cada carga agrega ítems al final del panel.
- El panel crece en altura.
- El scroll pertenece al documento.
- No se usa un `div` con `overflow-y-auto` como listado.
- No se usa `max-h-[...]` como mecanismo de navegación.
- La carga adicional es explícita mediante “Cargar más”.
- No se implementa scroll infinito dentro de una caja.

### 6.5 Comportamiento de apertura y cierre

- Click en la campana abre/cierra.
- Click fuera cierra.
- `Escape` cierra y devuelve el foco a la campana.
- Al abrir, se enfoca el encabezado del panel o el primer control útil.
- No se cierra al marcar una notificación.
- No se cierra al cargar más.
- No hay backdrop.
- No se bloquea el scroll de la página.
- El panel se cierra al navegar a otra ruta.
- Una notificación nueva no abre el panel automáticamente.
- El badge y el título se actualizan sin interrumpir la tarea actual.

### 6.6 Ruido visual y operativo

- El admin no muestra notificaciones de cambios de estado de pedidos.
- La bandeja no se abre sola ante eventos nuevos.
- No se muestran toasts por cada notificación; la campana y el título son suficientes.
- No se agregan sonidos ni vibraciones.
- El refresco de stock no debe hacer saltar el scroll ni robar el foco.
- El refresco de stock no debe cerrar una edición en curso.

### 6.7 Título de pestaña

El comportamiento se define en la sección 3. La UI de la bandeja no manipula el título directamente.

### 6.8 Accesibilidad

- `Escape` cierra y devuelve foco.
- Click fuera cierra.
- Sin focus trap.
- Botones con nombres accesibles.
- Contador anunciado en el `aria-label` de la campana.
- Estados de carga con `aria-busy`.
- El texto no depende solo del color para distinguir leída/no leída.
- El título de la pestaña es un refuerzo, no la única vía de información.

---

## 7. Resolución del desfase de paginación

### 7.1 Problema descartado

No se usará paginación por `offset` para la bandeja en tiempo real. Un offset estático se desfasa cuando:

- Entra una notificación nueva por Socket y se inserta arriba.
- Otra pestaña marca notificaciones.
- El backend reordena por fecha.
- Llega un evento antiguo durante una reconexión.
- Se filtran notificaciones históricas de pedidos del admin.

El resultado podría ser duplicados, saltos o notificaciones nunca cargadas.

### 7.2 Solución obligatoria: cursor keyset

La Fase 7 del backend expone paginación por cursor estable, ordenada por `(ocurridoEn DESC, id DESC)`.

```http
GET /notificaciones?limite=20
GET /notificaciones?limite=20&antesDe=<cursor>
```

Respuesta:

```json
{
  "items": [],
  "siguienteCursor": "cursor-opaco-o-null"
}
```

Reglas:

- `antesDe` es un cursor opaco emitido por el backend.
- El cursor identifica la posición del último ítem cargado: `ocurridoEn` + `id`.
- El backend valida el cursor y no acepta valores arbitrarios.
- `siguienteCursor` es `null` cuando no hay más resultados.
- Los eventos nuevos de Socket no modifican el cursor.
- Marcar como leída no cambia el orden ni el cursor.
- Insertar notificaciones arriba no altera la siguiente página.
- El frontend no calcula offsets ni suma elementos insertados.
- El filtro de tipos del admin se aplica antes de calcular el cursor.

El frontend guarda únicamente:

```ts
items: Notificacion[]
siguienteCursor: string | null
cargandoMas: boolean
```

Al cargar más:

1. Envía el `siguienteCursor` actual.
2. Agrega los nuevos ítems con deduplicación por `id`.
3. Reemplaza `siguienteCursor` por el valor recibido.
4. No modifica el cursor por eventos de Socket.

### 7.3 Defensa contra duplicados

- Por reconexiones.
- Por reintentos de red.
- Por eventos repetidos.
- Por solapamiento entre carga REST y evento Socket.
- Por eventos de refresco repetidos.

La deduplicación por `id` y por `eventoId` es una regla de consistencia, no un parche de compatibilidad.

---

## 8. Contratos REST definitivos

| Método | Ruta | Uso | Respuesta |
|---|---|---|---|
| `GET` | `/notificaciones?limite=20` | Primera página del historial admin | `{ items, siguienteCursor }` |
| `GET` | `/notificaciones?limite=20&antesDe=<cursor>` | Página anterior del historial admin | `{ items, siguienteCursor }` |
| `GET` | `/notificaciones/no-leidas/count` | Contador inicial del admin | `{ cantidad: number }` |
| `PATCH` | `/notificaciones/:id/leida` | Marcar una | `200`, incluye `leidaEn` |
| `PATCH` | `/notificaciones/leer-todas` | Marcar todas | `200`, incluye `leidaEn` y `cantidad` |

Reglas:

- `limite` se valida en backend; el frontend usa un valor estable de 20 o menos.
- El `id` es el de la notificación, no el de la fila destinatario.
- Los errores conservan `{ mensaje, code }`.
- El frontend usa el `apiFetch` existente.
- Las llamadas REST viven exclusivamente en `services/notificacionService.ts`.
- El servicio no maneja estado React, toasts ni sockets.
- El listado y el contador del admin excluyen `pedido.estado_cambiado`.
- El listado del admin solo devuelve `pedido.creado`, `sucursal.cerrada` y `stock.bajo`.
- La respuesta de lectura incluye `leidaEn` para reconciliar la lectura sin depender del reloj del cliente.
- La lectura masiva devuelve `cantidad` para auditoría y reconciliación.
- No se crea un endpoint adicional para el título de la pestaña; se deriva del contador.

---

## 9. Contratos Socket.io definitivos

### 9.1 Handshake

Obligatorio y único:

```ts
auth: { token: localStorage.getItem('token') }
```

Prohibido:

- Leer token de cookies para el socket.
- Leer token de query string.
- Leer token de headers custom.
- Usar el token de `administrador` u otra clave.
- Tener un fallback sin token.

El backend responde `AUTH_REQUIRED`, `AUTH_INVALID` o `AUTH_EXPIRED` cuando corresponde.

### 9.2 Evento `notificacion`

Payload del backend:

```ts
{
  id: number
  tipo: 'pedido.creado' | 'sucursal.cerrada' | 'stock.bajo'
  version: number
  ocurridoEn: string
  datos: Record<string, unknown>
  destinos?: Record<string, unknown>
}
```

Reglas para el admin:

- `pedido.estado_cambiado` no se entrega a salas admin.
- El mapper valida campos mínimos.
- El mapper agrega `leida: false` para eventos nuevos.
- El mapper agrega `leidaEn: null` cuando corresponde.
- El mapper descarta `destinos` del modelo de UI.
- El mapper descarta tipos no admitidos sin romper el render.
- Inserta con deduplicación por `id`.
- Ordena por `ocurridoEn` descendente.
- No altera `siguienteCursor`.

### 9.3 Evento `notificacion:leida`

```ts
type EventoNotificacionLeida =
  | { notificacionId: number; leidaEn: string }
  | { todas: true; leidaEn: string }
```

Reglas:

- Se emite al mismo administrador o sala correspondiente.
- `todas` permite sincronizar “Marcar todas” sin emitir N eventos.
- El frontend aplica la lectura de forma idempotente.
- Si la notificación ya estaba leída, no descuenta dos veces el contador.
- Si la notificación no está cargada en la página actual, no se inventa un ítem.
- El evento `todas` marca solo ítems con `ocurridoEn <= leidaEn`.
- Las notificaciones que llegaron después de `leidaEn` permanecen no leídas.
- El contador no se fuerza ciegamente a `0` si existen ítems posteriores.

### 9.4 Evento `stock.bajo`

Se mantiene el contrato de la sección 4.6. La lógica de cruce se define en backend; la UI solo presenta el hecho.

### 9.5 Evento `admin:refresco`

Se define en la sección 5.5. Es independiente de la bandeja y se emite por la misma conexión Socket.io.

### 9.6 Matriz de eventos y salas

| Evento | Cliente | Admin sucursal | Admin global | Persistencia | Uso |
|---|---|---|---|---|---|
| `notificacion` (`pedido.creado`) | Sí | Sí | Sí, según alcance | Sí | Bandeja |
| `notificacion` (`pedido.estado_cambiado`) | Sí | **No** | **No** | No para admin | Seguimiento del cliente |
| `notificacion` (`sucursal.cerrada`) | No | Sí | Según alcance | Sí | Bandeja |
| `notificacion` (`stock.bajo`) | No | Sí | Según alcance | Sí | Bandeja |
| `notificacion:leida` | No | Sí | Sí | No | Sincronización de lectura |
| `admin:refresco` | **No** | Sí, su sucursal | Sí, según filtro | No | Revalidación de pantallas |

Reglas:

- No se usa `role:admin` para eventos de sucursal.
- Para admin global se usa una sala exclusiva o un fan-out explícito.
- Las salas de cliente no reciben eventos administrativos.
- Los eventos de refresco no se persisten.

---

## 10. Arquitectura de capas en `admin/src/`

```txt
admin/src/
├── types/
│   ├── notificacion.types.ts
│   └── realtime.types.ts
├── services/
│   └── notificacionService.ts
├── realtime/
│   ├── socketClient.ts
│   ├── realtimeBus.ts
│   └── realtimeEvents.ts
├── utils/
│   └── notificaciones/
│       ├── mapearNotificacion.ts
│       ├── describirNotificacion.ts
│       └── formatoNotificacion.ts
├── context/
│   ├── notificaciones/
│   │   ├── NotificacionContext.tsx
│   │   ├── NotificacionProvider.tsx
│   │   └── notificacionReducer.ts
│   └── realtime/
│       ├── RealtimeContext.tsx
│       └── RealtimeProvider.tsx
├── hooks/
│   ├── useTituloNoLeidas.ts
│   ├── useRefrescoEnTiempoReal.ts
│   ├── useStockEnTiempoReal.ts
│   ├── useDesplegableNotificaciones.ts
│   └── useLogoutAdmin.ts
└── components/
    ├── NavBar.tsx
    └── notificaciones/
        ├── NotificacionCampana.tsx
        ├── NotificacionBadge.tsx
        ├── NotificacionPanel.tsx
        ├── NotificacionItem.tsx
        ├── NotificacionIcono.tsx
        └── NotificacionEstado.tsx
```

### 10.1 Responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `types/notificacion.types.ts` | DTOs, modelo normalizado, estado, acciones y eventos de bandeja. |
| `types/realtime.types.ts` | Dominios, eventos de refresco, estado de conexión y contratos del bus. |
| `services/notificacionService.ts` | Fetch tipado y normalización de respuestas HTTP. |
| `realtime/socketClient.ts` | Instancia única de Socket.io, autenticación y destrucción explícita. |
| `realtime/realtimeBus.ts` | Pub/sub tipado y desacoplado de React. |
| `realtime/realtimeEvents.ts` | Validación/normalización de eventos recibidos. |
| `mapearNotificacion.ts` | Validar y normalizar payloads REST/Socket del admin. |
| `describirNotificacion.ts` | Convertir dominio en título, descripción y detalle. |
| `formatoNotificacion.ts` | Fechas, importes, cantidades y contador. |
| `notificacionReducer.ts` | Transiciones puras del estado de bandeja. |
| `useTituloNoLeidas.ts` | Único escritor del título de la pestaña. |
| `useRefrescoEnTiempoReal.ts` | Suscripción genérica a eventos de refresco. |
| `useStockEnTiempoReal.ts` | Adaptación de refresco para la pantalla de stock. |
| `RealtimeContext.tsx` | Acceso al bus y al estado de conexión. |
| `RealtimeProvider.tsx` | Ciclo de vida del socket y publicación de eventos. |
| `NotificacionContext.tsx` | Contextos separados de estado y acciones. |
| `NotificacionProvider.tsx` | Carga inicial, reducer, acciones y título; consume el bus. |
| `NotificacionCampana.tsx` | Botón, badge, apertura y cierre. |
| `NotificacionPanel.tsx` | Historial, carga adicional y acción masiva. |
| `NotificacionItem.tsx` | Render y acción individual. |
| `NotificacionIcono.tsx` | Icono y tono visual por tipo. |
| `NotificacionEstado.tsx` | Carga, vacío y error. |
| `useDesplegableNotificaciones.ts` | Apertura, click externo, Escape y foco. |
| `useLogoutAdmin.ts` | Logout HTTP, desconexión y limpieza local. |

### 10.2 Prohibiciones de arquitectura

- `fetch` dentro de componentes.
- `io()` fuera de `realtime/socketClient.ts`.
- Importar `socket.io-client` fuera de `realtime/socketClient.ts`.
- Formatear textos dentro de componentes.
- Lógica de paginación dentro de `NotificacionPanel`.
- Estado de notificaciones en `NavBar`.
- Lógica de stock dentro del provider de notificaciones.
- Abrir una conexión en `Stock.tsx` o en cualquier página.
- Duplicar listeners por render, por ruta o por pestaña.
- Usar `role:admin` para eventos de una sucursal.
- Persistir eventos de refresco.
- Hacer polling o recargas periódicas como sustituto del socket.

---

## 11. Modelo de estado

### 11.1 Estado de notificaciones

```ts
interface EstadoNotificaciones {
  items: NotificacionAdmin[]
  noLeidas: number | null
  siguienteCursor: string | null
  hayMas: boolean
  cargandoInicial: boolean
  cargandoMas: boolean
  marcandoTodas: boolean
  error: string | null
}
```

Reglas:

- `noLeidas` es independiente de `items` porque la lista es paginada.
- `noLeidas` puede ser `null` mientras no se conozca el contador.
- El badge y el título no muestran un número inventado.
- `siguienteCursor` solo cambia por respuestas REST.
- Los eventos Socket no alteran `siguienteCursor`.
- La lista se deduplica por `id`.
- La lista se ordena por `ocurridoEn` descendente.
- La lista solo contiene los tres tipos admitidos para admin.
- El estado de conexión no se duplica: vive en `RealtimeProvider` o en un contexto de infraestructura equivalente.

### 11.2 Estado de realtime

```ts
interface EstadoRealtime {
  conexion: 'conectando' | 'conectado' | 'reconectando' | 'desconectado'
  ultimaConexionEn: string | null
  ultimoError: string | null
}
```

Reglas:

- Es estado de infraestructura, no de negocio.
- No contiene ítems de notificaciones ni filas de stock.
- Se actualiza con `connect`, `disconnect`, `reconnect_attempt` y `connect_error`.
- No se expone el token en el estado ni en logs.
- Un error de autenticación cierra la sesión.

### 11.3 Acciones del reducer de notificaciones

- `CARGA_INICIAL_INICIO`
- `CARGA_INICIAL_OK`
- `CARGA_INICIAL_ERROR`
- `CARGA_MAS_INICIO`
- `CARGA_MAS_OK`
- `CARGA_MAS_ERROR`
- `NUEVA_NOTIFICACION`
- `LECTURA_LOCAL_OPTIMISTA`
- `LECTURA_LOCAL_REVERTIR`
- `LECTURA_REMOTA`
- `MARCAR_TODAS_INICIO`
- `MARCAR_TODAS_OK`
- `MARCAR_TODAS_ERROR`
- `ERROR_ACTUALIZADO`

### 11.4 Reglas de concurrencia

1. Insertar por `id` es idempotente.
2. Marcar leída dos veces no descuenta dos veces.
3. Un evento remoto de lectura no duplica el descuento local.
4. “Marcar todas” conserva el valor de no leídas al iniciar y no descuenta las notificaciones que llegaron después del inicio.
5. Las notificaciones que llegan durante “Marcar todas” permanecen no leídas.
6. El evento `todas` usa `leidaEn` como límite; no borra llegadas posteriores.
7. Si falla una lectura optimista, se revierte solo si la marca de esa petición sigue vigente.
8. Si falla “Marcar todas”, no se altera lectura ni contador.
9. Si falla la carga de una página, se conserva el cursor anterior y se permite reintentar.
10. El contador se revalida al reconectar.

---

## 12. Socket.io y ciclo de sesión

### 12.1 Cliente único

`realtime/socketClient.ts` es el único módulo que importa `socket.io-client`.

Responsabilidades:

- Crear la instancia con `auth: { token: localStorage.getItem('token') }`.
- Usar `autoConnect: false`.
- Reutilizar la instancia si el token no cambió.
- Destruir la anterior si el token cambió.
- Exponer `desconectarSocketAdmin()`.
- No exponer la instancia a componentes.
- No manejar estado de notificaciones ni de stock.

### 12.2 Provider de infraestructura

`RealtimeProvider.tsx`:

- Recibe el token desde `AuthContext`.
- Registra listeners base antes de conectar.
- Conecta explícitamente.
- Publica eventos normalizados en el bus.
- Limpia listeners en el cleanup.
- No desconecta en cada render.
- Es compatible con StrictMode mediante instancia única y handlers estables.
- No duplica listeners.
- En `AUTH_REQUIRED`/`AUTH_INVALID`/`AUTH_EXPIRED`, cierra la sesión.
- Actualiza el estado de conexión sin introducir lógica de UI.
- Solicita revalidación de contador al reconectar.

### 12.3 Subscribers

- `NotificacionProvider` se suscribe a `notificacion` y `notificacion:leida`.
- `useStockEnTiempoReal` se suscribe a `admin:refresco` con `dominio: 'stock'`.
- Futuras pantallas agregan un dominio y un hook adaptador, sin tocar el socket.
- Todos los callbacks se desuscriben al desmontar.
- Los handlers no acceden a `socket` directamente.

### 12.4 Alcance del provider

```txt
ProtectedRoute
└── RealtimeProvider
    └── NotificacionProvider
        └── AdminLayout
            ├── NavBar
            └── Outlet
```

- No se abre socket en la pantalla de login.
- No se mantiene socket después del logout.
- No se abre un socket adicional al entrar a stock.

---

## 13. Token, sesión y logout

### 13.1 Contrato de sesión

- `types/sesion.types.ts`: contrato de login con token.
- `services/authService.ts`: devolver y validar el token.
- `utils/sesion.ts`: administrar `administrador` y `token`.
- `context/AuthContext.tsx`: exponer ambos y centralizar el cierre.
- `pages/Home.tsx`: delegar el login en el contexto.
- `hooks/useLogoutAdmin.ts`: encapsular el logout del navbar.

Claves exactas:

```txt
administrador
token
```

### 13.2 Invariantes

- No hay sesión válida sin administrador y token.
- No se leen sesiones antiguas sin token.
- No se aceptan dos formatos de respuesta de login.
- El token no se registra en consola, toasts ni mensajes de error.
- `isAuthenticated` exige ambos valores.
- El token se usa para Socket.io; la cookie se mantiene para REST.
- El socket nunca se autentica con la cookie.

### 13.3 Orden de logout

Secuencia obligatoria:

1. Intentar `cerrarSesionService()`.
2. En `finally`, ejecutar el cierre local.
3. Llamar explícitamente `socket.disconnect()`.
4. Destruir la instancia y limpiar listeners.
5. Limpiar el bus y las suscripciones.
6. Recién entonces ejecutar `localStorage.removeItem('administrador')` y `localStorage.removeItem('token')`.
7. Limpiar el estado de React.
8. Restaurar el título base de la pestaña.

La UI no manipula `localStorage` ni sockets directamente. El logout vive en `useLogoutAdmin` y `AuthContext`.

La expiración por 401 usa la misma secuencia: el evento de sesión expirada no limpia por su cuenta; `AuthContext` desconecta y luego limpia.

### 13.4 Logout con panel abierto

- El panel se desmonta.
- No debe quedar una suscripción activa.
- No debe quedar una conexión huérfana.
- El título no debe conservar el contador.
- No se debe producir una actualización de estado después del desmontaje.

---

## 14. Integración prevista en el proyecto

Esta sección es un mapa de cambios futuros, no una autorización para ejecutarlos en esta sesión.

### 14.1 Backend

- `src/notifications/destinatarios.js`: separar destinos de pedido creado y estado cambiado.
- `src/notifications/handlers/pedidoHandlers.js`: impedir fan-out admin en cambios de estado.
- `src/notifications/notificacionRepository.js`: excluir el tipo del listado y conteo admin.
- `src/controllers/pedidoController.js`: mantener el cruce de stock por venta y emitir refresco después del commit.
- `src/controllers/admin/stockController.js`: eliminar la alerta por cambio de mínimo; mantener baja manual con cruce; emitir refresco.
- `src/notifications/handlers/stockHandlers.js`: consistencia del payload y reglas de cruce.
- `src/sockets/salas.js`: sala exclusiva de admin global si se adopta.
- Nuevo módulo de realtime admin: emisión de `admin:refresco` por la misma conexión.
- Tests de notificaciones, sockets, stock y paginación.

### 14.2 Frontend admin

- `src/realtime/`: cliente, bus y normalizador de eventos.
- `src/context/realtime/`: provider y contexto de infraestructura.
- `src/hooks/useRefrescoEnTiempoReal.ts`: suscripción genérica.
- `src/hooks/useStockEnTiempoReal.ts`: adaptación de stock.
- `src/hooks/useTituloNoLeidas.ts`: título de pestaña.
- `src/context/notificaciones/`: consumir bus, quitar conexión propia, actualizar tipos.
- `src/components/notificaciones/`: eliminar el tipo de cambio de estado e icono asociado.
- `src/pages/Stock/Stock.tsx`: integrar el hook de refresco.
- `src/routes/AppRoutes.tsx`: montar `RealtimeProvider`.
- `src/components/NavBar.tsx`: mantener la campana.
- `src/context/AuthContext.tsx`: limpieza coordinada del bus y socket.

### 14.3 Sin cambios de esquema

- No se requiere una migración nueva para el filtro de pedidos.
- No se requiere persistir `admin:refresco`.
- No se requiere una tabla nueva para el título.
- La limpieza de filas históricas de estado es opcional y separada.
- La base de datos puede seguir usando el esquema actual.

---

## 15. Fases de ejecución de la versión 2.1

### Fase 0 — Aprobación del plan

- Revisar este documento.
- Confirmar contratos REST, Socket y bus.
- Confirmar que no se implementa código en esta sesión.

Criterio: aprobación explícita antes de iniciar C1.

### Fase C1 — Corrección del ruido de pedidos

- Separar destinatarios de `pedido.creado` y `pedido.estado_cambiado`.
- Impedir persistencia y emisión admin para cambios de estado.
- Filtrar históricos en listado y conteo admin.
- Ajustar tipos, mapper y UI del admin.
- Mantener intacto el flujo del cliente.

Criterio: matriz de destinatarios y tests de aceptación aprobados.

### Fase C2 — Criterio de stock bajo

- Formalizar la transición `antes > minimo && despues <= minimo`.
- Eliminar la alerta por configuración de mínimo.
- Confirmar ausencia de alertas en seeders, login, lectura y arranque.
- Agrupar movimientos por insumo y sucursal.
- Emitir después del commit.

Criterio: tabla de casos de la sección 4.7 aprobada.

### Fase C3 — Evento de refresco

- Definir `admin:refresco` y su normalizador.
- Emitir stock actualizado después de venta/ajuste.
- Definir salas de sucursal y admin global.
- Verificar que no se emite a clientes.
- Verificar que se emite aunque no haya `stock.bajo`.
- Probar fallo de emisión sin revertir la operación.

Criterio: contrato y tests de evento aprobados.

### Fase F8 — Título de pestaña

- Crear el hook único de título.
- Conectar el contador de no leídas.
- Implementar `99+` y estado sin contador.
- Restaurar título en logout/desmontaje.
- Verificar que no existan dos escritores.

Criterio: pruebas de la sección 3.5 aprobadas.

### Fase F9 — Arquitectura realtime y bus

- Mover/centralizar el cliente de socket.
- Crear bus tipado y provider único.
- Migrar la bandeja a suscripciones del bus.
- Eliminar la apertura de socket desde el provider de notificaciones.
- Implementar reconexión y estado de conexión.
- Verificar StrictMode y una sola conexión.

Criterio: una sola conexión y listeners sin duplicados.

### Fase F10 — Integración con stock

- Crear `useRefrescoEnTiempoReal`.
- Crear `useStockEnTiempoReal`.
- Integrar en `Stock.tsx` sin duplicar fetch.
- Implementar debounce, coalescencia y revalidación al reconectar.
- Evitar interrupciones durante edición.

Criterio: la tabla se actualiza sin recargar la página y sin toasts molestos.

### Fase F11 — Verificación final

- `npm run lint`.
- `npm run build`.
- Tests backend.
- Smoke real con dos sesiones/pestañas.
- Prueba de venta y actualización de stock.
- Prueba de título en pestaña oculta.
- Prueba de logout y ausencia de sockets huérfanos.
- Revisión de accesibilidad y responsive.

Criterio: matriz de aceptación completa y aprobación de revisión.

---

## 16. Matriz de aceptación

### 16.1 Notificaciones y filtro

| Escenario | Resultado esperado |
|---|---|
| Pedido creado | Admin recibe `pedido.creado`; contador aumenta una vez |
| Pedido cambia de estado | Admin no recibe evento ni aumenta contador |
| Pedido cambia de estado | Cliente sigue recibiendo el evento |
| Fila histórica de estado para admin | No aparece en listado ni conteo |
| Evento de estado llega por error al admin | Mapper lo descarta sin romper render |
| Notificación duplicada | Lista no duplica |
| Nueva notificación durante paginación | Cursor estable; sin duplicados ni saltos |

### 16.2 Título de pestaña

| Escenario | Resultado esperado |
|---|---|
| Sin contador conocido | Título base |
| Contador `0` | Título base |
| Contador `1` | `(1) Panel Admin - E-commerce` |
| Contador `100` | `(99+) Panel Admin - E-commerce` |
| Llega evento nuevo | Título se actualiza sin recargar |
| Marcar una | Título disminuye una vez |
| Marcar todas | Título base; nuevas posteriores se preservan |
| Otra pestaña marca | Título se sincroniza |
| Logout | No queda contador residual |
| Reconexión | Contador revalidado |

### 16.3 Stock bajo

| Escenario | Resultado esperado |
|---|---|
| Stock bajo inicial sin movimiento | Sin notificación |
| Login con stock bajo | Sin notificación |
| Cambio de mínimo sin movimiento | Sin notificación |
| Venta cruza el mínimo | Notificación |
| Venta ya estando bajo | Sin nueva notificación |
| Reposición y nuevo cruce | Nueva notificación |
| Ajuste manual que cruza | Notificación |
| Ajuste manual de alta | Sin notificación |
| Rollback | Sin notificación |
| Varios movimientos del mismo insumo | Una notificación con cantidad final |
| Varios insumos cruzados | Una notificación por insumo |

### 16.4 Reactividad de stock

| Escenario | Resultado esperado |
|---|---|
| Venta sin cruce de mínimo | Tabla se refresca; no hay `stock.bajo` |
| Venta con cruce | Tabla se refresca y hay `stock.bajo` |
| Ajuste manual | Otras pestañas se refrescan |
| Cambio de mínimo | Tabla se refresca; no hay alerta de stock bajo |
| Ráfaga de eventos | Una sola recarga por ventana de debounce |
| Admin de sucursal | Solo recibe su sucursal |
| Admin global | Recibe según selección o todas |
| Cliente | No recibe `admin:refresco` |
| Pantalla desmontada | Suscripción cancelada |
| Logout | Socket y bus limpios |
| Reconexión | Pantalla revalidada |
| Edición en curso | No se sobrescribe el formulario |
| Dos pestañas | Ambas se actualizan sin recargar |

### 16.5 UX y sesión

| Escenario | Resultado esperado |
|---|---|
| Mobile 320 px | Sin scroll horizontal ni truncamiento |
| Texto largo | Envuelve y crece |
| Panel largo | Scroll del documento, no interno |
| Teclado | Escape cierra y vuelve el foco |
| Evento nuevo | Panel no se abre solo |
| Logout con panel abierto | Sin conexión ni suscripción residual |
| Logout con API caída | Storage, socket y título se limpian igualmente |
| Token inválido | Socket rechaza y se cierra la sesión |
| Recarga de página | Sesión y conexión se restauran con token |

---

## 17. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Sigue llegando ruido de estados de pedido | Filtro en destinatarios + filtro REST + descarte en mapper |
| Filas históricas contaminan conteo | Exclusión antes de paginar y contar |
| El título pisa títulos de páginas | Un único propietario y constante base centralizada |
| El título muestra un número inventado | Derivar solo de `noLeidas`; `null` no muestra número |
| Alertas repetidas de stock | Solo transición `antes > minimo && despues <= minimo` |
| Stock bajo inicial genera fatiga | Sin escaneo en login/arranque; sin alerta por seed o mínimo |
| Se pierde un cruce por redondeo | Comparar con la misma precisión persistida |
| Evento de refresco se pierde | Revalidar al reconectar y al volver a la pestaña |
| Dos sockets en la misma sesión | Un solo cliente, un solo provider y tests de instancia |
| Listener duplicado por StrictMode | Registro/limpieza idempotente y handlers estables |
| Un suscriptor rompe a los demás | Bus aísla errores por handler |
| Refresco en bucle | La recarga no emite eventos; deduplicación por `eventoId` |
| Ráfaga de ventas satura la vista | Debounce y coalescencia de 250–500 ms |
| Refresco interrumpe edición | Cola de revalidación al cerrar el editor |
| Eventos de sucursal llegan a otros admins | No usar `role:admin`; salas `admin:sucursal` y `admin:global` |
| Token expuesto | No loguear token; handshake exclusivo y almacenamiento ya definido |
| Socket huérfano | Disconnect explícito antes de limpiar storage |
| Cursor se desfasa por filtros | Filtrar antes de calcular el cursor |
| `todas` borra notificaciones nuevas | Marcar solo hasta `leidaEn` y preservar posteriores |

---

## 18. Fuera de alcance

- Implementación de código en esta sesión.
- Modificación del plan v1.
- Cambios funcionales en esta sesión.
- Notificaciones push del navegador.
- Correo, SMS, sonidos o vibraciones.
- Repartidores.
- Página independiente de notificaciones.
- Filtros o búsqueda en la bandeja.
- Rediseño general del panel admin.
- Un segundo socket, namespace o canal paralelo.
- Polling periódico como sustituto del socket.
- Persistencia de eventos de refresco.
- Cola offline de eventos.
- Notificación de “stock recuperado”.
- Alertas de stock al iniciar sesión o por seeders.
- Actualización en tiempo real de todas las pantallas en esta iteración; solo stock como primer consumidor.
- Limpieza obligatoria de filas históricas de estados de pedido.

---

## 19. Definición de terminado de la versión 2.1

- [ ] El admin solo recibe `pedido.creado` para pedidos.
- [ ] `pedido.estado_cambiado` no se persiste ni se emite para administradores.
- [ ] El cliente conserva sus notificaciones de cambio de estado.
- [ ] Listado y contador admin excluyen estados históricos.
- [ ] El título se actualiza con `noLeidas`, incluye `(99+)` y se restaura al cerrar sesión.
- [ ] `stock.bajo` solo se emite en cruces dinámicos.
- [ ] No hay alertas por seeders, login, arranque, lectura o cambio de mínimo.
- [ ] No hay repetición mientras el stock sigue bajo.
- [ ] Existe `admin:refresco` por la misma conexión Socket.io.
- [ ] La tabla de stock se actualiza sin recargar la página.
- [ ] Solo hay una conexión Socket.io por sesión.
- [ ] La pantalla de stock se suscribe mediante un hook genérico y desacoplado.
- [ ] Las suscripciones se limpian al desmontar y al cerrar sesión.
- [ ] No hay sockets, listeners ni títulos residuales después del logout.
- [ ] Paginación por cursor sin desfase.
- [ ] Deduplicación e idempotencia verificadas.
- [ ] Sin modales, bottom sheets, overlays ni scroll interno.
- [ ] Sin truncamiento de textos.
- [ ] `npm run lint` y `npm run build` verdes.
- [ ] Tests backend verdes.
- [ ] Smoke test real entre dos pestañas aprobado.
- [ ] Contratos REST, Socket y bus aprobados por backend y frontend.

---

# Versión 2.2 — Reactividad de pedidos y navegación desde notificaciones

> Extensión del plan v2.1. No reemplaza ni modifica las secciones anteriores.
>
> Estado: implementada (G1–G5). Verificación final G6 en curso; el smoke real entre dos pestañas queda pendiente.
>
> Base: v2.1 implementada (C1, C2, C3, F8, F9 y F10). Esta versión agrega reactividad de pedidos y deep linking desde la bandeja.

## 20. Contexto y objetivos

### 20.1 Situación actual

- Un pedido nuevo genera `pedido.creado`, actualiza la campana y emite `admin:refresco` para el dominio `stock`.
- La pantalla de stock consume ese refresco y se actualiza sin intervención manual.
- La pantalla de pedidos no consume ningún refresco: requiere recarga manual o volver a entrar a la ruta para ver pedidos nuevos.
- Las notificaciones de la bandeja son informativas. Hacer clic en ellas no navega a ningún destino.
- El administrador debe buscar manualmente el pedido o la sucursal/insumo mencionado en la notificación.

### 20.2 Objetivo

1. Extender `admin:refresco` con el dominio `pedidos` para que la vista de pedidos se revalide al recibir un pedido nuevo, reutilizando la conexión Socket.io y el bus existentes.
2. Convertir las notificaciones en accesos directos:
   - `pedido.creado` abre el detalle del pedido en la sucursal correspondiente.
   - `stock.bajo` abre el stock de la sucursal correspondiente, filtrando y resaltando el insumo.
3. Aplicar modularidad estricta y descomposición de componentes en las pantallas y componentes que se toquen.
4. Eliminar cualquier compatibilidad con código obsoleto. No se mantienen alias, ramas legacy, feature flags ni fallbacks de versiones anteriores.

### 20.3 Principios no negociables

1. **Un solo socket:** se mantiene la instancia única de `admin/src/realtime/socketClient.ts`. Ninguna página, hook de pantalla ni componente abre sockets.
2. **Un solo bus:** las pantallas se suscriben mediante el bus y hooks adaptadores. No se registran listeners globales en páginas ni componentes.
3. **Revalidación, no mutación especulativa:** el evento indica que algo cambió; la pantalla vuelve a leer su fuente de verdad con su función de carga existente.
4. **Evento después del commit:** ningún refresco se emite dentro de la transacción ni antes de confirmar la operación.
5. **Independencia:** el refresco de pedidos y el de stock son eventos separados. El fallo de uno no revierte la operación ni impide el otro.
6. **Alcance por sucursal:** un admin de sucursal no recibe refrescos de otra sucursal. El master recibe solo la sucursal que está viendo, salvo que en el futuro se defina una vista global.
7. **URL como intención inicial:** los parámetros de deep link se interpretan una vez al entrar. No se reaplican en cada recarga de datos.
8. **Seguridad existente:** el backend y los guards actuales siguen siendo la autoridad. El frontend no duplica reglas de permisos.
9. **Cero código defensivo innecesario:** no se soportan payloads, rutas ni parámetros de versiones viejas. Solo se valida lo que cruza un límite de confianza (payload Socket, parámetros de URL y respuestas HTTP).
10. **Sin duplicación de lógica:** no se duplican fetches, mapeos de notificaciones, constructores de rutas ni reglas de cruce de stock.

### 20.4 Alcance de la versión 2.2

- Emisión backend de `admin:refresco` para `pedidos/creado`.
- Consumo frontend en la pantalla de pedidos.
- Deep link de `pedido.creado` al detalle del pedido.
- Deep link de `stock.bajo` al stock de la sucursal con foco en el insumo.
- Cierre coordinado del panel de notificaciones al navegar.
- Descomposición de los componentes que concentran múltiples responsabilidades.
- Tests backend y verificación de lint/build/smoke.

### 20.5 Fuera de alcance de la versión 2.2

- Refresco automático entre pestañas para cambios de estado de pedidos.
- Nuevas notificaciones de estado para administradores. La regla C1 de v2.1 sigue intacta.
- Nuevos endpoints, migraciones o cambios de esquema.
- Un segundo socket, namespace o canal paralelo.
- Notificaciones push del navegador, correo, SMS, sonido o vibración.
- Rediseño general de pedidos, stock o de la bandeja.
- Persistencia de eventos de refresco.
- Compatibilidad con rutas, payloads o componentes eliminados.
- Cambios en la aplicación del cliente.

### 20.6 Relación con la versión 2.1

Se conservan sin cambios:

- `pedido.estado_cambiado` no se persiste ni se emite para administradores.
- El cliente sigue recibiendo `pedido.estado_cambiado`.
- `stock.bajo` solo se emite por cruce dinámico del mínimo.
- El título de pestaña se deriva de `noLeidas`.
- La bandeja usa el bus realtime.
- La pantalla de stock se revalida con `useRefrescoEnTiempoReal`.

La versión 2.2 solo agrega un consumidor y dos destinos de navegación.

---

## 21. Reactividad en tiempo real para pedidos

### 21.1 Evento `admin:refresco` de pedidos

Se reutiliza el contrato existente. No se crea un evento nuevo.

| Campo | Valor |
|---|---|
| `version` | `1` |
| `eventoId` | UUID generado por el backend |
| `dominio` | `'pedidos'` |
| `accion` | `'creado'` |
| `ocurridoEn` | ISO 8601 |
| `sucursalId` | Sucursal del pedido creado |
| `recursos.pedidoId` | ID del pedido creado |

Salas:

- `admin:sucursal:<sucursalId>`.
- `admin:global` para el master sin sucursal asignada.
- Nunca `role:admin` para eventos de sucursal.
- Nunca salas de cliente.

Reglas:

- Se emite una sola vez por pedido creado.
- Se emite después de `commit` de la creación del pedido.
- Se emite aunque no haya `stock.bajo`.
- Es independiente de `notificarPedidoCreado` y de `notificarStockBajoDeVentas`.
- Un error al emitir no revierte el pedido ni cambia la respuesta HTTP.
- Un rollback no emite el evento.

### 21.2 Backend

Archivo principal:

- `Backend/src/controllers/pedidoController.js`: agregar la emisión del refresco `pedidos/creado` inmediatamente después del commit y del refresco de stock existente, dentro del bloque posterior a la transacción.

No se agrega:

- Nuevo módulo de emisión.
- Nuevo contrato Socket.
- Nueva sala.
- Nueva ruta REST.
- Persistencia del evento.

Tests:

- `Backend/tests/controllers/pedidoController.test.js`:
  - emite `admin:refresco` de dominio `pedidos`, acción `creado`, con `sucursalId` y `recursos.pedidoId`;
  - no emite si la transacción falla o se revierte;
  - un fallo del emisor no cambia el `201` ni revierte el pedido;
  - el refresco de stock y el de pedidos son llamadas independientes.
- `Backend/tests/notifications/adminRefresco.test.js`:
  - acepta el dominio `pedidos`;
  - respeta las salas de sucursal y global;
  - no emite a salas de cliente.
- `Backend/tests/sockets/`:
  - el cliente no recibe `admin:refresco`;
  - un admin de sucursal no recibe eventos de otra sucursal.

### 21.3 Frontend: hook adaptador

Nuevo archivo:

- `admin/src/hooks/usePedidosEnTiempoReal.ts`.

Responsabilidad:

- adaptar `useRefrescoEnTiempoReal` a la pantalla de pedidos;
- fijar `dominios: ['pedidos']`;
- recibir `sucursalId`, `pausado` y `onRefrescar`;
- usar el mismo debounce de 350 ms que stock;
- revalidar al reconectar y al volver a la pestaña;
- entregar el lote de eventos en orden cronológico, del más antiguo al más nuevo;
- no abrir sockets ni hacer fetch por sí mismo.

Contrato propuesto:

```ts
interface OpcionesPedidosTiempoReal {
  sucursalId: number | null
  pausado?: boolean
  onRefrescar: (
    eventos: EventoRefrescoAdmin[],
  ) => void | Promise<void>
}
```

Reglas:

- Si `sucursalId` es `null`, la pantalla no tiene una sucursal válida y no debe refrescar. Se pasa `pausado: true` al hook genérico.
- `onRefrescar` recibe el lote normalizado para conocer los `recursos.pedidoId` de la ráfaga.
- El hook no conoce filtros, paginación ni el modal de detalle.
- El hook no crea un segundo listener de `admin:refresco`.

### 21.4 Integración en `Pedidos.tsx`

La pantalla conserva su responsabilidad de contenedor:

- resolver sucursal según rol;
- cargar la lista;
- aplicar filtros y paginación;
- abrir el detalle.

Cambios:

- extraer una función `recargarPedidos()` que reutilice `traerPedidos(sucursalId)` y actualice solo `pedidos`;
- no reiniciar `seleccion`, `errorFila`, filtros ni búsqueda durante una revalidación realtime;
- no mostrar el estado de carga de página completa durante una revalidación; la lista anterior permanece visible;
- usar `usePedidosEnTiempoReal` con `pausado` mientras hay un cambio de estado en curso (`guardando !== null`);
- al recibir el lote, recordar los `recursos.pedidoId` como pedidos nuevos y resaltar el más reciente.

Comportamiento ante un pedido nuevo:

1. Se revalida la lista de la sucursal actual.
2. Los eventos de una ráfaga se procesan en orden cronológico, del más antiguo al más nuevo.
3. No se cambia de página automáticamente, no se altera la posición relativa de los ítems y la lista no se sacude.
4. Si el pedido no queda visible por la página o los filtros actuales, no se borran los filtros. Se muestra un aviso no intrusivo con el número de pedido y una acción “Ver pedido” que abre su detalle.
5. La tarjeta del pedido visible se resalta de forma discreta durante unos segundos. No se usa toast ni sonido.
6. El modal de detalle abierto no se cierra ni se recarga por un evento de lista. Su contenido se carga por ID y es independiente de la lista.

Casos que no deben ocurrir:

- doble fetch por ráfaga de eventos;
- fetch paralelo si ya hay una revalidación en curso;
- pérdida de selecciones locales por una revalidación;
- salto de página por eventos de otra sucursal;
- refresco cuando no hay sucursal seleccionada.

### 21.5 Límite explícito

Los cambios de estado de pedidos realizados por un administrador no emiten `admin:refresco` en esta versión. No son notificaciones de admin y no se agregan eventos nuevos. Otra pestaña verá el cambio al revalidar por reconexión, al volver a entrar o por una recarga manual.

---

## 22. Deep linking desde notificaciones

### 22.1 Contrato de destinos

| Tipo de notificación | Destino | Comportamiento |
|---|---|---|
| `pedido.creado` | `/admin/pedidos?pedido=<pedidoId>&sucursal=<sucursalId>` | Selecciona la sucursal si corresponde y abre el detalle del pedido |
| `stock.bajo` | `/admin/sucursales/<sucursalId>/stock?insumo=<insumoId>` | Abre el stock de la sucursal, filtra por el insumo y lo resalta |
| `sucursal.cerrada` | Sin destino | Solo permite marcar como leída; no navega |

Parámetros:

- `pedido`: ID positivo del pedido.
- `sucursal`: ID positivo de la sucursal; solo se aplica al master.
- `insumo`: ID positivo del insumo.

Decisiones:

- Se usan query params para reutilizar las rutas existentes y conservar el contexto de lista.
- No se crea una ruta nueva de detalle.
- No se crea una página nueva de notificaciones.
- Los nombres de parámetros se centralizan en constantes.
- No se admiten alias como `pedidoId`, `id` o `sucursalId` en la URL.

### 22.2 Utilidad de construcción de destinos

Nuevo archivo:

- `admin/src/utils/notificaciones/destinoNotificacion.ts`.

Responsabilidad:

- recibir una `Notificacion` ya normalizada;
- devolver un string de destino o `null`;
- construir los query params con `URLSearchParams`;
- no usar `window`, `navigate` ni estado de React;
- no validar nuevamente el payload de la notificación, porque ya fue validado por el mapper.

Contrato propuesto:

```ts
export function construirDestinoNotificacion(
  notificacion: Notificacion,
): string | null
```

Reglas:

- `pedido.creado` devuelve el destino de pedidos.
- `stock.bajo` devuelve el destino de stock.
- `sucursal.cerrada` devuelve `null`.
- La función es pura y puede probarse sin navegador.

### 22.3 Comportamiento al hacer clic

La notificación se convierte en un acceso directo accesible.

Al hacer clic en una notificación con destino:

1. Si está no leída, se marca como leída de forma optimista reutilizando `marcarLeida`.
2. No se espera la respuesta HTTP para navegar.
3. Se navega al destino.
4. El panel se cierra por el cambio de navegación.
5. Si el marcado falla, la navegación ya ocurrió y el reducer revierte el estado local según el flujo existente.

Al hacer clic en “Marcar leída”:

- no se navega;
- se detiene la propagación;
- se conserva el comportamiento actual.

Sin destino (`sucursal.cerrada`):

- la fila no es un enlace;
- solo está disponible la acción de marcar como leída.

Accesibilidad:

- el área navegable es un enlace o botón real, no un `div` con `onClick`;
- no se anidan botones;
- se conserva el texto descriptivo como nombre accesible;
- el foco visible usa los tokens existentes;
- Enter y Space funcionan según el elemento elegido;
- Escape del panel sigue cerrando y devolviendo el foco a la campana.

### 22.4 Cierre del panel en navegación por query

El hook `useDesplegableNotificaciones` actualmente cierra el panel al cambiar `location.pathname`. Eso no cubre una navegación que solo cambia el query string, por ejemplo desde `/admin/pedidos` a `/admin/pedidos?pedido=10`.

Ajuste:

- cerrar el panel ante cualquier navegación, usando `location.key` como disparador;
- no cerrar por cambios internos de estado que no navegan;
- no agregar lógica de cierre dentro de `NotificacionItem`.

### 22.5 Descomposición de la bandeja

`NotificacionItem.tsx` hoy mezcla presentación, acción de lectura y, con este cambio, navegación. Se descompone en:

| Archivo | Responsabilidad |
|---|---|
| `components/notificaciones/NotificacionItem.tsx` | Componer la fila y decidir si es navegable |
| `components/notificaciones/NotificacionContenido.tsx` | Icono, título, descripción, fecha y detalle |
| `components/notificaciones/NotificacionAccionLeida.tsx` | Botón “Marcar leída” y `stopPropagation` |
| `hooks/useAbrirNotificacion.ts` | Marcar leída si corresponde y navegar al destino |
| `utils/notificaciones/destinoNotificacion.ts` | Construcción pura de la URL |

Reglas:

- `NotificacionItem` no construye URLs.
- `NotificacionItem` no conoce `useNavigate`.
- `NotificacionContenido` no conoce acciones.
- `NotificacionAccionLeida` no conoce la fila ni la navegación.
- No se duplica la descripción ni el formateo de fecha.

### 22.6 Deep link de pedidos

`Pedidos.tsx` incorpora un hook de entrada:

- `admin/src/hooks/usePedidoDeepLink.ts`.

Responsabilidades:

- leer `pedido` y `sucursal` desde `useSearchParams`;
- ignorar y limpiar parámetros inválidos o ausentes;
- para el master, inicializar la sucursal desde `sucursal` antes de cargar la lista;
- para un admin de sucursal, usar siempre su propia sucursal e ignorar `sucursal`;
- abrir `DetallePedidoModal` con `pedidoId`;
- al cerrar el modal, quitar `pedido` de la URL con `replace`;
- conservar `sucursal` para que el master siga viendo la sucursal del pedido.

Reglas:

- El deep link no modifica los filtros de la lista.
- El modal no depende de que el pedido esté en la página actual.
- Si el pedido no existe o no pertenece a la sucursal, la respuesta de la API y los guards existentes definen el error. No se agrega lógica defensiva de compatibilidad.
- El botón “Ver detalle” de una tarjeta no cambia a un deep link; mantiene su comportamiento local.
- La navegación desde la campana sí usa la URL y deja historial coherente.

### 22.7 Deep link de stock

`Stock.tsx` incorpora un hook de entrada:

- `admin/src/hooks/useStockDeepLink.ts`.

Responsabilidades:

- leer `insumo` desde `useSearchParams`;
- esperar a que el stock de la sucursal esté cargado;
- buscar el insumo por ID;
- reutilizar el buscador existente: `busqueda` se completa con el nombre del insumo;
- asegurar que el filtro de estado no oculte el insumo;
- marcar el insumo como resaltado;
- hacer scroll al elemento resaltado;
- quitar el parámetro `insumo` al cambiar manualmente búsqueda o filtro.

Reglas:

- No se crea un filtro paralelo ni una tabla duplicada.
- El resaltado usa los tokens visuales existentes; no se agregan colores nuevos.
- El resaltado es temporal y discreto.
- El parámetro se aplica una sola vez por navegación.
- Una revalidación realtime no vuelve a aplicar el deep link ni hace scroll.
- Si el insumo no existe en esa sucursal, se limpia el parámetro y se deja la vista normal.
- El guard `SoloSuSucursal` sigue siendo la única autoridad de acceso a la ruta.

### 22.8 Descomposición de stock

Para incorporar el resaltado sin seguir concentrando responsabilidades en un archivo de 678 líneas, se extrae:

| Archivo | Responsabilidad |
|---|---|
| `pages/Stock/Stock.tsx` | Contenedor: datos, permisos, modales, filtros y coordinación |
| `components/stock/StockTabla.tsx` | Tabla de escritorio y tarjetas móviles de inventario |
| `components/stock/StockFila.tsx` | Presentación de un insumo, estado y acciones |
| `components/stock/StockMovimientos.tsx` | Historial, filtro y listado de movimientos |
| `hooks/useStockDeepLink.ts` | Interpretación del query param y resaltado |

Reglas:

- Los modales de aumento, mínimo y baja se mantienen en el contenedor en esta versión para no mezclar el refactor con cambios funcionales.
- `StockTabla` recibe `resaltadoId` y callbacks de acción.
- `StockMovimientos` recibe movimientos y filtro; no hace fetch.
- El contenedor conserva la función `recargar` existente.
- No se cambia la lógica de negocio de stock.

---

## 23. Modularidad y calidad

### 23.1 Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `admin/src/hooks/usePedidosEnTiempoReal.ts` | Adaptador de refresco para pedidos |
| `admin/src/hooks/usePedidoDeepLink.ts` | Entrada por URL y apertura del detalle de pedido |
| `admin/src/hooks/useStockDeepLink.ts` | Entrada por URL y resaltado de insumo |
| `admin/src/hooks/useAbrirNotificacion.ts` | Marcar leída y navegar desde una notificación |
| `admin/src/utils/notificaciones/destinoNotificacion.ts` | Construcción pura de URLs de notificación |
| `admin/src/components/pedidos/PedidoCard.tsx` | Tarjeta de pedido |
| `admin/src/components/pedidos/SelectorEtapa.tsx` | Selector accesible de etapa |
| `admin/src/components/notificaciones/NotificacionContenido.tsx` | Presentación del contenido de una notificación |
| `admin/src/components/notificaciones/NotificacionAccionLeida.tsx` | Acción de marcar como leída |
| `admin/src/components/stock/StockTabla.tsx` | Inventario responsive |
| `admin/src/components/stock/StockFila.tsx` | Fila/tarjeta de un insumo |
| `admin/src/components/stock/StockMovimientos.tsx` | Historial de movimientos |

### 23.2 Archivos modificados

| Archivo | Cambio |
|---|---|
| `Backend/src/controllers/pedidoController.js` | Emisión de `admin:refresco` de pedidos después del commit |
| `Backend/tests/controllers/pedidoController.test.js` | Cobertura del nuevo refresco |
| `Backend/tests/notifications/adminRefresco.test.js` | Cobertura del dominio `pedidos` y salas |
| `admin/src/pages/pedidos/Pedidos.tsx` | Consumo realtime, deep link y extracción de tarjetas |
| `admin/src/pages/Stock/Stock.tsx` | Deep link, resaltado y extracción de tablas/movimientos |
| `admin/src/components/notificaciones/NotificacionItem.tsx` | Composición de fila navegable |
| `admin/src/hooks/useDesplegableNotificaciones.ts` | Cierre del panel ante navegación por query |
| `admin/src/types/notificacion.types.ts` | Sin cambios de tipos de dominio; no se agregan tipos legacy |
| `admin/src/types/realtime.types.ts` | Sin cambios; `pedidos` ya existe como dominio |

### 23.3 Reglas de código

- No usar `any` para evitar modelar el evento.
- No importar `socket.io-client` fuera de `realtime/socketClient.ts`.
- No crear listeners dentro de `Pedidos.tsx` ni `Stock.tsx`.
- No duplicar la lógica de debounce, deduplicación ni reconexión.
- No duplicar la normalización de notificaciones.
- No crear helpers genéricos sin un segundo consumidor real.
- No dejar exports, props, imports o componentes sin uso.
- No agregar comentarios que expliquen código obvio.
- Mantener nombres de dominio en español, consistentes con el resto del admin.
- Usar los tokens de color y estilos existentes.
- Mantener `noUnusedLocals` y `noUnusedParameters` satisfechos.

### 23.4 Prohibiciones de esta versión

- Rutas alternativas o aliases para deep links.
- Parámetros de URL duplicados.
- Compatibilidad con notificaciones sin `pedidoId`, `sucursalId` o `insumoId`.
- Nuevos estados globales para navegación.
- Navegación desde `NotificacionContenido`.
- Fetch de pedidos o stock dentro de componentes presentacionales.
- Refrescos en pantallas que no estén montadas.
- Polling como respaldo del socket.
- Abrir una segunda conexión para pedidos.

---

## 24. UX y accesibilidad

### 24.1 Pedidos nuevos

- La lista no se vacía durante una revalidación.
- El pedido nuevo se resalta de forma discreta y temporal.
- No se muestra un toast por cada pedido.
- Si el pedido no es visible por filtros, el aviso no tapa la tabla ni abre un overlay.
- La acción “Ver pedido” abre el detalle existente.
- El scroll no se mueve si el usuario está interactuando con el detalle.
- En mobile no se genera scroll horizontal.

### 24.2 Notificaciones navegables

- La fila navegable tiene foco visible.
- El texto completo de la notificación sigue siendo el nombre accesible.
- “Marcar leída” sigue siendo una acción independiente.
- El panel se cierra al navegar.
- Escape cierra el panel.
- El foco vuelve a la campana al cerrar con Escape.
- No se abre el panel automáticamente por un evento nuevo.
- No se pierde el estado de lectura si la navegación ocurre antes de la respuesta del PATCH.

### 24.3 Stock por deep link

- El insumo objetivo queda visible en la primera página del resultado filtrado.
- El resaltado no depende solo del color: se mantiene el badge de estado existente.
- El historial de movimientos no se altera.
- El foco visual es temporal; no se convierte en un estado permanente.
- Si el usuario cambia la búsqueda, el resaltado se limpia.

---

## 25. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Se abre un segundo socket para pedidos | Reutilizar `useRefrescoEnTiempoReal` y el bus existente |
| La lista de pedidos se refresca en cada evento de stock | Adaptador con `dominios: ['pedidos']` |
| Un admin ve pedidos de otra sucursal | Filtro por `sucursalId` en el hook y salas del backend |
| El pedido nuevo no se ve por paginación | No cambiar de página; aviso con acción al detalle |
| El refresco pisa una selección local | Revalidar solo `pedidos`; no reiniciar selección ni errores por fila |
| Ráfaga de pedidos genera múltiples fetches | Debounce y coalescencia del hook genérico |
| Un evento llega durante un guardado | `pausado` mientras `guardando !== null`; revalidación al terminar |
| El panel no se cierra al navegar por query | Cerrar con `location.key`, no solo `pathname` |
| El clic en la notificación no marca leída | El botón de lectura se mantiene separado y con `stopPropagation` |
| El modal se reabre al cerrar | Quitar `pedido` de la URL con `replace` |
| El master abre el pedido en la sucursal equivocada | Inicializar desde `sucursal` antes del fallback a la primera sucursal |
| Un admin de sucursal manipula `sucursal` en la URL | El frontend usa su sucursal asignada; backend y guards siguen validando |
| El deep link de stock no encuentra el insumo | Limpiar el parámetro y dejar la vista normal |
| El resaltado se reaplica en cada refresco | Aplicar el parámetro una sola vez por navegación |
| Se agrega compatibilidad legacy innecesaria | Sin aliases, sin fallbacks y sin ramas de versión |
| El refactor rompe la pantalla de stock | Extraer componentes con las mismas props y sin cambiar la lógica de negocio |

---

## 26. Fases de ejecución de la versión 2.2

### Fase G0 — Aprobación del plan

- Revisar esta extensión.
- Confirmar rutas, query params, contrato de evento y comportamiento de clic.
- Confirmar que no se implementa código en esta sesión.

Criterio: aprobación explícita antes de iniciar G1.

### Fase G1 — Refresco backend de pedidos

- Emitir `admin:refresco` de dominio `pedidos` después del commit.
- Incluir `sucursalId` y `recursos.pedidoId`.
- Mantener independencia con stock y notificaciones.
- Agregar tests de emisión, rollback y aislamiento de errores.

Criterio: tests backend verdes y contrato validado.

### Fase G2 — Realtime de pedidos en el admin

- Crear `usePedidosEnTiempoReal`.
- Integrar en `Pedidos.tsx` con `recargarPedidos`.
- Implementar pausa durante guardado.
- Implementar resaltado y aviso por filtros.
- Verificar que no se dupliquen fetches ni sockets.

Criterio: un pedido nuevo aparece sin F5 en la sucursal correcta.

### Fase G3 — Núcleo de deep linking

- Crear `destinoNotificacion`.
- Crear `useAbrirNotificacion`.
- Descomponer `NotificacionItem`.
- Ajustar el cierre del panel por navegación.
- Implementar navegación de `pedido.creado` y `stock.bajo`.

Criterio: clic en notificación marca leída, navega y cierra el panel.

### Fase G4 — Deep link de pedidos

- Crear `usePedidoDeepLink`.
- Inicializar sucursal del master desde la URL.
- Abrir `DetallePedidoModal` desde el parámetro.
- Limpiar el parámetro al cerrar.
- Extraer `PedidoCard` y `SelectorEtapa`.

Criterio: el pedido de la notificación se abre en su sucursal y su detalle.

### Fase G5 — Deep link de stock y descomposición

- Crear `useStockDeepLink`.
- Extraer `StockTabla`, `StockFila` y `StockMovimientos`.
- Aplicar búsqueda, filtro y resaltado.
- Hacer scroll al insumo.
- Verificar el guard de sucursal.

Criterio: la notificación de stock abre el insumo correcto resaltado.

### Fase G6 — Verificación final

- `npm.cmd test -- --runInBand` en `Backend`.
- `npm.cmd run lint` en `admin`.
- `npm.cmd run build` en `admin`.
- Smoke con dos pestañas.
- Smoke de deep links de pedido y stock.
- Smoke de master y admin de sucursal.
- Prueba de logout y reconexión.
- Revisión de accesibilidad y mobile 320 px.

Criterio: matriz de aceptación completa y revisión aprobada.

---

## 27. Matriz de aceptación de la versión 2.2

### 27.1 Reactividad de pedidos

| Escenario | Resultado esperado |
|---|---|
| Pedido nuevo en la sucursal seleccionada | La lista se revalida sin F5 |
| Pedido nuevo con la campana abierta | La campana se actualiza; la lista también |
| Pedido nuevo en otra sucursal | No se refresca la sucursal actual |
| Master viendo una sucursal | Solo recibe refrescos de esa sucursal |
| Admin de sucursal | Solo recibe su sucursal |
| Ráfaga de pedidos | Una sola revalidación por debounce |
| Pedido nuevo durante un guardado | Se pospone y se revalida al terminar |
| Pedido nuevo con filtros que no coinciden | Aviso con acción “Ver pedido”; no se borran filtros |
| Pedido nuevo sin filtros y página distinta de 1 | Se muestra en la lista |
| Rollback de creación | No hay refresco |
| Fallo del emisor | El pedido se crea igual |
| Cliente | No recibe `admin:refresco` |
| Pantalla desmontada | No hay fetch ni suscripción activa |
| Reconexión | La lista se revalida |
| Logout | Socket, bus y listeners limpios |

### 27.2 Deep link de pedido

| Escenario | Resultado esperado |
|---|---|
| Clic en `pedido.creado` | Navega a `/admin/pedidos?pedido=...&sucursal=...` |
| Notificación no leída | Se marca leída y luego navega |
| Botón “Marcar leída” | No navega |
| Notificación ya leída | Navega sin cambiar el contador |
| Master con otra sucursal seleccionada | Cambia a la sucursal del pedido |
| Admin de sucursal con `sucursal` manipulado | Usa su propia sucursal |
| Pedido abierto | Se muestra `DetallePedidoModal` |
| Cerrar el detalle | Se quita `pedido` de la URL con `replace` |
| Volver atrás después del detalle | No se reabre el mismo modal |
| Panel abierto en `/admin/pedidos` | Se cierra al cambiar solo el query string |
| Pedido inexistente | El error lo define la API; no se agrega fallback legacy |
| `sucursal.cerrada` | No navega; solo se puede marcar leída |
| Teclado | Enter/Space activan el enlace; Escape cierra el panel |

### 27.3 Deep link de stock

| Escenario | Resultado esperado |
|---|---|
| Clic en `stock.bajo` | Navega a `/admin/sucursales/<id>/stock?insumo=<id>` |
| Insumo existente | Se filtra por nombre y se resalta |
| Insumo fuera de la primera página | Queda visible por el filtro |
| Insumo con stock bajo | Se conserva el badge de estado |
| Insumo sin stock | Se conserva el badge “Sin stock” |
| Insumo inexistente | Se limpia el parámetro y no se rompe la vista |
| Cambio manual de búsqueda | Se limpia el resaltado y el parámetro |
| Revalidación realtime | No se repite el scroll ni el resaltado |
| Admin de sucursal | Solo puede abrir su sucursal |
| Master | Puede abrir la sucursal indicada |
| Mobile 320 px | Sin scroll horizontal ni truncamiento |

### 27.4 Calidad y arquitectura

| Escenario | Resultado esperado |
|---|---|
| `admin/src` | Solo `realtime/socketClient.ts` importa `socket.io-client` |
| Páginas | No abren sockets ni registran listeners globales |
| Bundle | `Pedidos` no introduce un segundo cliente realtime |
| Componentes | Sin archivos gigantes con navegación, fetch y presentación mezclados |
| Tipos | Sin `any` ni campos legacy |
| Lint | Sin errores |
| Build | `tsc -b` y Vite completan |
| Tests backend | Todos verdes |
| Logout | Sin sockets, listeners ni título residual |

---

## 28. Definición de terminado de la versión 2.2

- [ ] El backend emite `admin:refresco` de dominio `pedidos` después del commit.
- [ ] El evento incluye `sucursalId` y `recursos.pedidoId`.
- [ ] El evento no se emite en rollback.
- [ ] El fallo del emisor no revierte la creación del pedido.
- [ ] Un pedido nuevo aparece en la vista de pedidos sin F5.
- [ ] El refresco de pedidos respeta la sucursal seleccionada.
- [ ] El master y el admin de sucursal reciben solo lo que corresponde.
- [ ] El refresco de pedidos no duplica fetches ni sockets.
- [ ] La lista no pierde selecciones locales por una revalidación.
- [ ] Un pedido nuevo no visible por filtros muestra un aviso con acción.
- [ ] Clic en `pedido.creado` abre el detalle correcto.
- [ ] Clic en `stock.bajo` abre el stock y resalta el insumo.
- [ ] Clic en una notificación la marca como leída.
- [ ] El botón “Marcar leída” no navega.
- [ ] El panel se cierra al navegar, incluso si solo cambia el query string.
- [ ] Cerrar el detalle quita `pedido` de la URL.
- [ ] El deep link de stock no repite el resaltado en cada refresco.
- [ ] Los permisos siguen delegados a `SoloSuSucursal` y al backend.
- [ ] `NotificacionItem` quedó descompuesto.
- [ ] `Pedidos.tsx` quedó descompuesto en tarjeta y selector.
- [ ] `Stock.tsx` quedó descompuesto en tabla, fila y movimientos.
- [ ] No se agregó compatibilidad legacy ni aliases de URL.
- [ ] `npm run lint` en `admin` sin errores.
- [ ] `npm run build` en `admin` verde.
- [ ] `npm test -- --runInBand` en `Backend` verde.
- [ ] Smoke real de dos pestañas aprobado.
- [ ] Smoke real de deep links aprobado.
- [ ] Revisión de accesibilidad y mobile aprobada.

---

## 29. Criterio de aprobación

Esta extensión se considera aprobada cuando backend y frontend confirman:

1. El evento `pedidos/creado` reutiliza el contrato existente y no genera notificaciones nuevas.
2. Las rutas con query params son las definitivas.
3. El comportamiento de clic, marcado de lectura y cierre del panel es el esperado.
4. La descomposición de componentes propuesta es suficiente y no introduce un refactor innecesario.
5. No se implementará ningún punto hasta recibir aprobación explícita.

Una vez aprobada, la implementación comienza por G1 y respeta el orden G1 → G6.

---

# Versión 2.3 - UX de la bandeja y deep link nominal de stock

> Extensión del plan v2.2. No reemplaza ni elimina el contenido anterior.
>
> Estado: propuesta para aprobación. En esta sesión no se implementa código.
>
> Base: v2.2 implementada (G1-G5), con G6 pendiente de smoke real.
>
> Prevalencia normativa: esta versión define la regla vigente para:
>
> - altura y scroll del panel de notificaciones: secciones 6.1, 6.2 y 6.4;
> - tamaño de página de la bandeja del admin: secciones 7.2 y 8;
> - contrato y comportamiento del deep link de stock: secciones 22.1, 22.2, 22.7, 24.3 y 27.3.
>
> El resto de las reglas de v2.1 y v2.2 sigue vigente.

## 30. Contexto y alcance

### 30.1 Problema de UX detectado

La bandeja actual:

- solicita 20 notificaciones en la carga inicial;
- crece en altura y usa el scroll del documento;
- puede sacar de contexto al usuario cuando la lista es larga;
- abre el stock con un deep link basado en el ID del insumo y, al cargar, muestra el modal global de stock bajo.

Ese comportamiento no cumple la nueva regla de negocio: al entrar desde una alerta de `stock.bajo`, la pantalla de stock debe mostrar únicamente el insumo de esa alerta, con su nombre exacto cargado en el buscador. La entrada manual desde el menú lateral debe conservar la vista completa.

### 30.2 Objetivo

- Cargar 8 notificaciones en la apertura inicial y 5 adicionales por cada clic en “Ver más”.
- Mantener la paginación por cursor keyset, sin offsets ni recálculos locales.
- Limitar el popover de la campana a una altura controlada con scroll interno contenido.
- Abrir el stock desde `stock.bajo` con el nombre exacto del insumo inyectado en el buscador y aislar esa fila.
- Diferenciar explícitamente la entrada desde la campana de la entrada manual por el menú lateral.
- Mantener la modularidad existente y evitar compatibilidad legacy o alias de URL.

### 30.3 Fuera de alcance

- Cambios de esquema, migraciones o nuevas tablas.
- Cambios en el contrato de eventos Socket.io o en la lógica de cruce de stock bajo.
- Cambios en el backend de notificaciones o en el cursor keyset.
- Scroll infinito.
- Modal, bottom sheet o overlay para la bandeja.
- Nuevas rutas de stock o páginas de notificaciones.
- Persistencia del tamaño de página o del filtro en `localStorage`/`sessionStorage`.
- Alias de query params, ramas por versión o fallbacks de compatibilidad.
- Implementación de código en esta sesión.

### 30.4 Principios de diseño

- El backend sigue siendo la autoridad de paginación y orden.
- El nombre del insumo es el disparador UX del deep link; la pantalla no aplica un filtro genérico de “stock bajo”.
- El scroll de la lista no debe encadenarse con el scroll del documento.
- La carga adicional es explícita, acotada y sin dobles fetches.
- La entrada manual y la entrada desde la campana son flujos distintos.
- Los componentes presentacionales no hacen fetch ni conocen sockets.
- No se agrega código defensivo para contratos o URLs obsoletas.

## 31. Paginación inicial 8 + 5

### 31.1 Contrato de carga

La bandeja del admin usa dos tamaños fijos:

| Constante | Valor | Uso |
|---|---:|---|
| `LIMITE_INICIAL` | 8 | Primera carga del panel |
| `LIMITE_VER_MAS` | 5 | Cada clic en “Ver más” |

Solicitudes:

```http
GET /notificaciones?limite=8
GET /notificaciones?limite=5&antesDe=<cursor>
```

Reglas:

- El backend ya valida `limite` como entero entre 1 y 100; no requiere cambios.
- La primera solicitud no envía `antesDe`.
- Cada clic en “Ver más” envía el `siguienteCursor` vigente y `limite=5`.
- No se usa `offset` ni se calcula la posición de la página en el frontend.
- No se conserva el valor 20 de v2.1 para la bandeja del admin.
- No se admiten tamaños variables por dispositivo, usuario o ancho de pantalla.
- La primera carga devuelve hasta 8 elementos; si el backend tiene menos, devuelve los disponibles.
- Una carga adicional devuelve hasta 5 elementos; si quedan menos, devuelve los disponibles y `siguienteCursor: null`.
- El botón “Ver más” solo existe si `siguienteCursor !== null`.
- Mientras `cargandoMas` es `true`, el botón queda deshabilitado y un segundo clic no dispara otra solicitud.
- Un error en la carga adicional conserva los ítems ya visibles y el cursor anterior; “Reintentar” repite la misma solicitud.

### 31.2 Contrato del servicio frontend

`admin/src/services/notificacionService.ts` expone una firma explícita, sin sobrecargas ni compatibilidad con la firma anterior:

```ts
interface OpcionesListarNotificaciones {
  limite: number
  antesDe?: string | null
}

export async function listarNotificaciones(
  opciones: OpcionesListarNotificaciones,
): Promise<PaginaNotificaciones>
```

Reglas:

- La función construye `limite` y `antesDe` con `URLSearchParams`.
- La firma anterior basada solo en `antesDe` no se mantiene.
- El servicio no conoce las constantes de UI; el provider pasa `8` o `5`.
- El servicio no maneja estado React, toasts, sockets ni reintentos.
- La validación de la respuesta continúa siendo la actual: `items` es array y `siguienteCursor` es string o `null`.

### 31.3 Integración con el provider

`NotificacionProvider` conserva el estado actual:

```ts
items: Notificacion[]
siguienteCursor: string | null
cargandoMas: boolean
hayMas: boolean
```

Cambios:

- `cargarInicial()` llama a `listarNotificaciones({ limite: LIMITE_INICIAL })`.
- `cargarMas()` llama a `listarNotificaciones({ limite: LIMITE_VER_MAS, antesDe: siguienteCursor })`.
- No se agrega un estado de “página”.
- No se reinicia `items` al cargar más.
- El cursor se reemplaza únicamente con la respuesta del servidor.
- La deduplicación por `id` y la fusión con notificaciones de Socket se mantienen.

### 31.4 Relación con notificaciones en tiempo real

- Un evento Socket insertado arriba no modifica `siguienteCursor`.
- El evento puede hacer que la lista visible supere los 8 elementos; el límite de 8 aplica a la carga REST inicial, no a la cantidad total mostrada.
- Al cargar más, el servidor puede devolver notificaciones que ya llegaron por Socket. La deduplicación por `id` evita duplicados.
- Si la deduplicación descarta una notificación ya presente, el clic igualmente puede incorporar menos de 5 filas nuevas visibles. Esto es correcto: el límite es de solicitud, no de filas netas agregadas.
- Marcar como leída no altera el cursor ni el orden.
- Un evento Socket no dispara una carga adicional de la bandeja.

## 32. Popover acotado con scroll interno

### 32.1 Estructura visual

El panel deja de crecer con el documento. Se estructura en tres zonas:

| Zona | Comportamiento |
|---|---|
| Encabezado | Altura natural, no scrollea, contiene título, resumen y “Marcar todas” |
| Lista | Scroll interno, contiene estados e ítems |
| Pie | Altura natural, no scrollea, contiene “Ver más” |

Contenedor:

```txt
max-h-[380px] flex flex-col overflow-hidden
```

- El alto máximo total del panel es `380px`.
- El panel conserva ancho, bordes, fondo y sombra actuales.
- El panel no usa `max-h` en píxeles calculados por JavaScript.
- En mobile mantiene el mismo límite y el mismo scroll interno; no se convierte en modal.
- Si el contenido es menor a `380px`, el panel conserva altura natural.

Lista:

```txt
min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]
```

Reglas:

- Solo la lista scrollea.
- El encabezado y el pie permanecen visibles.
- `overscroll-contain` impide que el scroll se propague al documento al llegar al borde.
- No se aplica `overflow: hidden` al `body`.
- No se usa `position: fixed` en el panel ni bloqueo del scroll de la página.
- No se usa scroll infinito.
- No se agrega `max-height` por ítem.
- Los textos largos siguen las reglas de la sección 6.3.

### 32.2 Comportamiento del scroll

- Al abrir el panel, la lista se posiciona en el inicio para mostrar las notificaciones más recientes.
- Mientras el panel permanece abierto, se conserva la posición interna de la lista.
- Al cerrar y volver a abrir, la lista vuelve al inicio.
- La rueda, el trackpad y el gesto táctil dentro de la lista mueven solo la lista.
- Al llegar al final de la lista, el gesto no mueve la página principal.
- Un evento Socket nuevo no mueve el scroll interno ni el de la página.
- Al hacer clic en “Ver más”, el pie permanece fijo y, cuando la carga termina, la lista se desplaza al final para revelar los ítems agregados.
- El desplazamiento posterior a “Ver más” es interno y no mueve la página.
- Si el usuario prefiere movimiento reducido, el desplazamiento es instantáneo.

### 32.3 Pie y botón “Ver más”

- El texto exacto del botón es “Ver más”.
- El pie no forma parte del área scrolleable.
- El botón se oculta si no hay más páginas.
- El botón muestra “Cargando...” y queda deshabilitado mientras `cargandoMas` es `true`.
- El botón no se reemplaza por un observador de intersección.
- Un error de carga muestra el estado de error existente y conserva el botón para reintentar.

### 32.4 Accesibilidad

- El contenedor scrolleable recibe `tabIndex={0}` y un nombre accesible, por ejemplo `aria-label="Lista de notificaciones"`.
- El foco puede entrar y salir de la lista; no hay focus trap.
- `aria-busy` refleja carga inicial y carga adicional.
- La cantidad cargada se anuncia de forma cortés cuando termina una carga adicional.
- Los ítems conservan sus roles y nombres accesibles actuales.
- `Escape` cierra y devuelve el foco a la campana.
- El scroll interno no depende solo del puntero: PageUp, PageDown, Home y End funcionan con la lista enfocada.

## 33. Deep link de stock por nombre exacto

### 33.1 Contrato de URL

El destino de `stock.bajo` pasa a ser:

```txt
/admin/sucursales/<sucursalId>/stock?buscar=<insumoNombre>
```

Parámetros:

| Parámetro | Fuente | Regla |
|---|---|---|
| `buscar` | `datos.insumoNombre` | Nombre exacto del insumo, codificado con `URLSearchParams` |

Reglas:

- El nombre se toma de la notificación ya normalizada; la UI no lo reconstruye ni lo busca por ID.
- El parámetro se envía una sola vez, sin duplicados.
- `URLSearchParams` se encarga de espacios, acentos, `&`, `+` y caracteres especiales.
- El valor se lee con `searchParams.get('buscar')` y se normaliza con `trim()`.
- Un valor vacío o solo con espacios no aplica deep link.
- No se admiten alias como `insumo`, `insumoId`, `nombre`, `q` o `busqueda`.
- El parámetro `insumo` de v2.2 deja de usarse para stock y no se resuelve como fallback.
- No se agrega un parámetro de ID oculto ni una ruta alternativa.
- La URL sigue siendo compartible y recargable.
- La ruta continúa protegida por `SoloSuSucursal`; el deep link no reemplaza permisos.

Justificación:

- `Insumo.nombre` es único en el modelo y el nombre de la alerta identifica el insumo dentro de la sucursal.
- El nombre es el dato que el usuario ve y el que se inyecta en el buscador.
- El ID no se transporta porque el contrato es nominal y no se admiten dos fuentes de verdad para el mismo destino.

### 33.2 Aplicación en la pantalla de stock

`admin/src/hooks/useStockDeepLink.ts` deja de interpretar IDs y pasa a interpretar el nombre:

Responsabilidades:

- leer `buscar` desde `useSearchParams`;
- devolver el nombre normalizado o `null`;
- exponer una acción para quitar `buscar` con `replace`;
- no buscar en `stock`, no navegar y no manejar estado de resaltado.

`Stock.tsx` aplica el deep link una sola vez por navegación:

1. Espera a que el stock de la sucursal esté cargado.
2. Busca una coincidencia exacta por nombre, comparando `item.nombre.trim() === nombreBuscado`.
3. Si no hay coincidencia, quita `buscar` de la URL con `replace` y deja la vista normal.
4. Si hay coincidencia:
   - completa el buscador con el nombre exacto del insumo;
   - fuerza `filtroEstado` a `todos`;
   - restringe la lista al `id` de esa fila;
   - vuelve a la página 1;
   - marca la fila como resaltada durante 4 segundos;
   - no abre el modal global de stock bajo en esa entrada.
5. La marca de aplicación se reinicia cuando `buscar` desaparece de la URL.

Reglas:

- La restricción al `id` resuelto es la que garantiza que se muestre únicamente el insumo de la alerta, aunque otro nombre contenga el mismo texto.
- No se crea un filtro visible paralelo.
- El buscador visible contiene el nombre exacto; el filtro por nombre sigue siendo el control principal.
- El filtro de estado no puede ocultar el insumo: se fuerza `todos`.
- Si el insumo ya no está bajo de stock o está deshabilitado, igual se muestra, porque el deep link no filtra por estado.
- El resaltado usa los tokens visuales existentes.
- Una revalidación realtime no vuelve a aplicar el deep link, no hace scroll y no reabre el modal.
- El parámetro se aplica una sola vez por `location.key`; volver a hacer clic en la misma notificación desde la campana genera una nueva navegación y vuelve a aplicar el foco.
- No se usa el ID del insumo como plan B si el nombre no coincide.

### 33.3 Interacción manual y limpieza

El deep link se limpia cuando el usuario toma el control:

- al cambiar el texto del buscador;
- al cambiar el filtro de estado;
- al usar “Ver en la lista” desde el modal de stock bajo;
- al cambiar de sucursal.

Al limpiar:

- se quita `buscar` de la URL con `replace`;
- se elimina la restricción al `id` resuelto;
- se limpia el resaltado;
- la búsqueda y el filtro pasan a comportarse como siempre;
- no se agrega una entrada al historial por la limpieza.

### 33.4 Entrada manual desde el menú lateral

La ruta sin `buscar` es el flujo manual:

- no se precarga el buscador;
- no se restringe a un insumo;
- `filtroEstado` queda en `todos`;
- se muestra el inventario completo de la sucursal, incluidos todos los insumos con stock bajo;
- el modal global de stock bajo conserva el comportamiento actual;
- no se aplica automáticamente el filtro “Stock bajo”.

La diferencia es explícita y no depende de memoria de navegación, `sessionStorage` ni un flag global:

| Entrada | Búsqueda | Filtro de estado | Filas | Modal de stock bajo |
|---|---|---|---|---|
| Campana, `stock.bajo` | Nombre exacto precargado | `todos` | Solo el insumo de la alerta | No se abre |
| Menú lateral | Vacía | `todos` | Inventario completo | Se conserva el actual |

### 33.5 Casos límite

| Caso | Resultado |
|---|---|
| Nombre con espacios o acentos | Se codifica y decodifica correctamente |
| Nombre inexistente o insumo eliminado | Se quita `buscar` y se muestra la vista normal |
| Insumo repuesto antes del clic | Se muestra igual, sin filtro de estado |
| Insumo deshabilitado | Se muestra igual, con su estado actual |
| Varias alertas del mismo insumo | Cada notificación abre el mismo nombre; no se duplica la fila |
| Nombres con texto compartido | La restricción por `id` resuelto evita mostrar coincidencias parciales |
| Revalidación realtime | No reaplica deep link ni scroll |
| Cambio manual de búsqueda | Se limpia `buscar` y la restricción por ID |
| Navegación atrás | La URL vuelve al estado anterior; si contiene `buscar`, se aplica una vez |
| Admin de sucursal | Solo puede abrir su sucursal; el guard sigue vigente |
| Master | Puede abrir la sucursal indicada en la ruta |

## 34. Modularidad y archivos afectados

### 34.1 Archivos y responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `admin/src/services/notificacionService.ts` | Firma por opciones y límites 8/5 |
| `admin/src/context/notificaciones/NotificacionProvider.tsx` | Carga inicial y “Ver más” con los nuevos límites |
| `admin/src/components/notificaciones/NotificacionPanel.tsx` | Shell del popover, encabezado, pie y estados |
| `admin/src/components/notificaciones/NotificacionLista.tsx` | Región scrolleable y listado de ítems |
| `admin/src/hooks/useScrollNotificaciones.ts` | Scroll interno, foco inicial y desplazamiento posterior a “Ver más” |
| `admin/src/utils/navegacion/parametros.ts` | Constante `PARAM_BUSQUEDA = 'buscar'` |
| `admin/src/utils/notificaciones/destinoNotificacion.ts` | Destino de stock por nombre |
| `admin/src/hooks/useStockDeepLink.ts` | Lectura, normalización y limpieza de `buscar` |
| `admin/src/utils/stock/filtrarStock.ts` | Filtro puro por búsqueda, estado e ID objetivo |
| `admin/src/pages/Stock/Stock.tsx` | Aplicación única del deep link, supresión del modal y resaltado |

### 34.2 Reglas de estructura

- `NotificacionPanel` no implementa scroll manual ni conoce el servicio.
- `NotificacionLista` es presentacional; recibe ítems y estado.
- `useScrollNotificaciones` no hace fetch ni conoce notificaciones.
- `destinoNotificacion` sigue siendo una función pura.
- `useStockDeepLink` no conoce la lista de stock.
- `filtrarStock` es una función pura y testeable sin React.
- `Stock.tsx` conserva la coordinación de datos, permisos, modales y acciones.
- Los componentes de stock ya extraídos no cambian de contrato.
- No se agrega un segundo cliente Socket.io ni un listener de notificaciones en la página.

### 34.3 Prohibiciones

- No usar `window.location` para leer o escribir query params.
- No usar `localStorage`/`sessionStorage` para recordar el deep link.
- No usar índices de array como identidad de insumo.
- No comparar nombres con `includes` para resolver el deep link.
- No crear endpoints nuevos.
- No tocar el contrato de `notificacion` ni `admin:refresco`.
- No mantener el parámetro `insumo` como alias.
- No duplicar la lógica de filtrado entre `Stock.tsx` y `filtrarStock`.

## 35. Estado, concurrencia e invariantes

- La bandeja sigue usando un único cursor keyset.
- La carga inicial y la carga adicional nunca se ejecutan en paralelo.
- El contador de no leídas sigue siendo independiente de la paginación.
- La inserción de una notificación por Socket no altera `siguienteCursor`.
- La lista puede contener más de 8 elementos por eventos Socket; no se recorta.
- La deduplicación por `id` se mantiene antes y después de cada carga.
- El orden sigue siendo `ocurridoEn DESC, id DESC`.
- El estado de lectura no altera el cursor.
- La limpieza de `buscar` no altera datos de stock ni dispara recargas.
- El deep link no modifica el stock, solo la vista.
- La restricción por ID objetivo se mantiene ante revalidaciones realtime.
- La restricción se libera solo por interacción manual o cambio de ruta.
- La entrada manual nunca hereda un `buscar` de una navegación previa.

## 36. Matriz de aceptación de la versión 2.3

### 36.1 Paginación 8 + 5

| Escenario | Resultado esperado |
|---|---|
| Apertura con 20 o más notificaciones | Se solicitan 8 y se muestran las 8 primeras |
| Apertura con menos de 8 | Se muestran todas las disponibles |
| Clic en “Ver más” | Se solicita `limite=5` con el cursor vigente |
| Segundo clic en “Ver más” | Se usa el nuevo cursor y se agregan hasta 5 más |
| Última página | `siguienteCursor: null` y el botón desaparece |
| Doble clic rápido | Una sola solicitud por clic efectivo |
| Evento Socket entre páginas | El cursor no cambia y no hay duplicados |
| Evento Socket durante carga inicial | La lista fusiona y ordena sin duplicados |
| Error al cargar más | Se conservan ítems y cursor; se puede reintentar |
| Marcar leída | No cambia el cursor ni la página |
| Logout | Se limpian ítems, cursor y estado de carga |

### 36.2 Popover y scroll

| Escenario | Resultado esperado |
|---|---|
| Panel con muchas notificaciones | Alto máximo de 380 px |
| Scroll dentro de la lista | Solo se mueve la lista |
| Scroll al llegar al borde | No se propaga a la página principal |
| Scroll con la página detrás | La página no se mueve ni se bloquea |
| Encabezado y pie | Permanecen visibles |
| “Ver más” | Carga 5 y desplaza la lista al final |
| Evento Socket nuevo | No mueve el scroll del panel ni de la página |
| Cierre y reapertura | La lista vuelve al inicio |
| Escape | Cierra y devuelve el foco a la campana |
| Mobile 320 px | Sin scroll horizontal y con scroll interno |
| Teclado | PageUp/PageDown/Home/End funcionan en la lista enfocada |
| Movimiento reducido | El desplazamiento posterior a “Ver más” es instantáneo |

### 36.3 Deep link de stock y entrada manual

| Escenario | Resultado esperado |
|---|---|
| Clic en `stock.bajo` | Navega a `/admin/sucursales/<id>/stock?buscar=<nombre>` |
| Nombre con espacios/acentos | Se codifica y se inyecta completo en el buscador |
| Insumo encontrado | Se muestran únicamente sus datos y se resalta |
| Otros insumos con stock bajo | No aparecen en la vista del deep link |
| Modal global de stock bajo | No se abre en la entrada desde la campana |
| Insumo repuesto | Se muestra igual, con su estado actual |
| Insumo deshabilitado | Se muestra igual, con su badge actual |
| Nombre inexistente | Se quita `buscar` y se muestra la vista normal |
| Revalidación realtime | No se reaplica el filtro, el scroll ni el resaltado |
| Cambio manual de búsqueda | Se quita `buscar` y se libera la restricción |
| Cambio manual de estado | Se quita `buscar` y se libera la restricción |
| “Ver en la lista” del modal | Se limpia el deep link antes de aplicar el filtro de estado |
| Entrada desde el menú lateral | Sin búsqueda precargada y con inventario completo |
| Entrada manual con stock bajo | Se ven todos los insumos, no solo el de una alerta |
| Admin de sucursal | Solo accede a su sucursal |
| Master | Accede a la sucursal indicada |
| URL con `insumo`, `nombre` o `q` | No se interpreta como alias |
| Recarga de la URL | Se vuelve a aplicar el deep link una vez |
| Volver atrás | Se restaura el estado anterior de la URL |

### 36.4 Calidad

| Escenario | Resultado esperado |
|---|---|
| Build | `tsc -b` y Vite completan |
| Lint | Sin errores |
| Backend | Sin cambios de contrato; tests existentes verdes |
| Sockets | Sin un segundo cliente ni listeners duplicados |
| Servicios | Sin estado React ni navegación |
| Hooks | Deep link y scroll separados de la presentación |
| Tipos | Sin `any`, sin campos legacy y sin alias |
| URLs | Sin parámetros de compatibilidad |
| Documento | El contenido de v2.1 y v2.2 permanece intacto |

## 37. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| El panel vuelve a crecer con la página | `max-h-[380px]` y lista interna scrolleable |
| El scroll interno mueve la página | `overscroll-contain` y sin bloqueo del body |
| “Ver más” dispara dos fetches | `cargandoMas` deshabilita el botón |
| El cursor se desfasa por eventos Socket | El cursor solo cambia con respuestas REST |
| La carga adicional repite ítems | Deduplicación por `id` |
| El deep link muestra más de un insumo | Resolución exacta por nombre y restricción por ID |
| El modal de stock bajo tapa el insumo objetivo | No se abre en una entrada válida desde la campana |
| La entrada manual hereda un filtro | La ruta sin `buscar` no precarga nada |
| Un nombre no existe | Se limpia `buscar` y se deja la vista normal |
| Se agrega compatibilidad con `insumo` | Se elimina del contrato y no se acepta como alias |
| El resaltado se repite en realtime | Aplicación única por navegación |
| El nombre se compara por subcadena | Comparación exacta con `trim()` |
| La URL se rompe con caracteres especiales | `URLSearchParams` en construcción y lectura |
| Se duplica lógica de filtrado | Función pura compartida `filtrarStock` |
| El refactor rompe accesibilidad | La lista scrolleable es enfocable y conserva roles |

## 38. Fases de ejecución de la versión 2.3

### Fase H0 - Aprobación del plan

- Revisar esta extensión.
- Confirmar el contrato `?buscar=<insumoNombre>`.
- Confirmar la diferencia entre entrada por campana y entrada manual.
- Confirmar que no se implementa código en esta sesión.

Criterio: aprobación explícita antes de iniciar H1.

### Fase H1 - Paginación 8 + 5

- Cambiar la firma de `listarNotificaciones` a opciones.
- Aplicar `LIMITE_INICIAL = 8` y `LIMITE_VER_MAS = 5`.
- Ajustar `NotificacionProvider` sin tocar el cursor.
- Renombrar el botón a “Ver más”.
- Verificar deduplicación, doble clic y última página.

Criterio: primera carga de 8 y cargas adicionales de 5 con cursor estable.

### Fase H2 - Popover acotado

- Extraer `NotificacionLista` y `useScrollNotificaciones`.
- Aplicar `max-h-[380px]`, layout flex y scroll interno.
- Aplicar `overscroll-contain` y `scrollbar-gutter`.
- Desplazar al final solo después de “Ver más”.
- Verificar teclado, mobile, cierre y reapertura.

Criterio: el scroll de la página no se mueve al recorrer la lista.

### Fase H3 - Deep link nominal de stock

- Agregar `PARAM_BUSQUEDA`.
- Cambiar el destino de `stock.bajo` a `?buscar=<insumoNombre>`.
- Retirar el uso de `insumo` en stock.
- Implementar `filtrarStock` con ID objetivo.
- Aplicar el deep link una vez, suprimir el modal y resaltar.
- Implementar la limpieza por interacción manual.
- Verificar entrada manual completa.

Criterio: campana muestra un solo insumo; menú lateral muestra el inventario completo.

### Fase H4 - Calidad

- Revisar que no se agregaron alias ni compatibilidad legacy.
- Ejecutar `npm run lint` y `npm run build` en `admin`.
- Ejecutar `npm test -- --runInBand` en `Backend`.
- Revisar accesibilidad y mobile.

Criterio: lint/build/backend verdes y sin warnings nuevos atribuibles a esta versión.

### Fase H5 - Smoke real

- Abrir la campana con más de 8 notificaciones.
- Recorrer la lista y comprobar que la página no se mueve.
- Cargar 5 más varias veces y verificar el cursor.
- Entrar manualmente a stock y verificar el inventario completo.
- Hacer clic en una alerta de stock bajo y verificar búsqueda, aislamiento y ausencia del modal global.
- Repetir con otra sucursal y con un admin de sucursal.
- Verificar mobile y recarga de URL.

Criterio: smoke aprobado con dos pestañas y roles distintos.

## 39. Definición de terminado de la versión 2.3

- [ ] La carga inicial solicita `limite=8`.
- [ ] Cada “Ver más” solicita `limite=5` con el cursor vigente.
- [ ] El cursor no cambia por eventos Socket.
- [ ] No hay duplicados por reconexión, reintento o solapamiento.
- [ ] El botón “Ver más” se deshabilita durante la carga.
- [ ] El panel tiene alto máximo de 380 px.
- [ ] Solo la lista tiene scroll interno.
- [ ] El scroll de la página no se mueve al recorrer la lista.
- [ ] El scroll no se encadena al llegar al borde.
- [ ] “Ver más” desplaza la lista al final sin mover la página.
- [ ] El deep link de stock usa `?buscar=<insumoNombre>`.
- [ ] El buscador muestra el nombre exacto del insumo.
- [ ] Se muestra únicamente el insumo de la alerta.
- [ ] El modal global de stock bajo no se abre desde la campana.
- [ ] La entrada manual muestra el inventario completo sin búsqueda precargada.
- [ ] La entrada manual conserva el modal global actual.
- [ ] La revalidación realtime no reaplica el deep link.
- [ ] La interacción manual limpia `buscar` y la restricción por ID.
- [ ] No se acepta `insumo` ni otro alias.
- [ ] `NotificacionLista`, `useScrollNotificaciones` y `filtrarStock` están descompuestos.
- [ ] No se duplica lógica de filtrado.
- [ ] `npm run lint` en `admin` sin errores.
- [ ] `npm run build` en `admin` verde.
- [ ] `npm test -- --runInBand` en `Backend` verde.
- [ ] Smoke real de campana, scroll y deep link aprobado.
- [ ] Revisión de accesibilidad y mobile aprobada.

## 40. Criterio de aprobación

Esta extensión se considera aprobada cuando se confirman:

1. La bandeja usa cursor keyset con 8 iniciales y 5 adicionales por clic.
2. El popover tiene alto máximo de 380 px y scroll interno contenido.
3. El deep link de `stock.bajo` es nominal: `?buscar=<insumoNombre>`.
4. La campana muestra solo el insumo de la alerta y el menú lateral muestra el inventario completo.
5. No se admiten alias de URL ni código de compatibilidad legacy.
6. La implementación no comienza hasta recibir aprobación explícita.

Una vez aprobada, la implementación sigue el orden H1 → H5.
