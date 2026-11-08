# Roles y permisos del panel de administración

Cadena de altas: el **master** crea a los **encargados** y cada encargado crea a los **empleados** de su sucursal.

| Rol | Valor en la base | Sucursal |
|---|---|---|
| Master (dueño de BurgerFast) | `MASTER` | ninguna: ve todas |
| Encargado | `ADMIN` | una |
| Empleado | `EMPLEADO` | una |

## Qué puede hacer cada rol

| Acción | Master | Encargado | Empleado |
|---|---|---|---|
| Ver pedidos | de cualquier sucursal (de a una) | de su sucursal | de su sucursal |
| **Cambiar el estado de un pedido** | no | no | **sí, de su sucursal** |
| Reportes | globales o por sucursal | de su sucursal | no |
| Ver stock, cargar aumentos y bajas | cualquier sucursal | su sucursal | no |
| Definir el stock mínimo | sí | no | no |
| Suspender productos de su sucursal (transitorio, con motivo) | no | sí | no |
| Deshabilitar un producto en una sucursal, sin plazo | sí | no | no |
| Levantar la suspensión de un producto | cualquiera, también las del encargado | solo las que él puso | no |
| Ver las suspensiones (solo lectura) | todas | las de su sucursal | no |
| Cerrar su sucursal temporalmente, con motivo (contingencia) | no | sí | no |
| Reabrir una sucursal cerrada temporalmente | sí, cualquiera (también las que cerró el encargado) | sí, la suya | no |
| Ver los cierres temporales | todos | el de su sucursal | recibe un aviso |
| Dar un parte al encargado (equipo roto, falta de insumo, problema con un pedido) | no | no | sí |
| Ver y resolver los partes de su sucursal | no (solo lectura por API) | sí | solo ve los suyos |
| Ver sus notificaciones y su perfil, y cambiar su contraseña | sí | sí | sí |
| Productos, categorías, insumos, promociones y menú | sí | no | no |
| Crear, editar y desactivar sucursales | sí | no | no |
| Ver los datos de su sucursal ("Mi sucursal") | sí | sí, solo lectura | no |
| Editar los datos de una sucursal | sí | no | no |
| Editar el horario de una sucursal | sí | sí, solo si el master lo habilitó para esa sucursal | no |
| Habilitar o no a los encargados a editar el horario (perilla en Sucursales) | sí | no | no |
| Definir el cupo de empleados de una sucursal | sí | no | no |
| Crear, editar, desactivar y reactivar encargados | sí | no | no |
| Crear, editar, desactivar y reactivar empleados | sí | solo los de su sucursal | no |

## Reglas de negocio

- Cada sucursal tiene **2 encargados activos**, ni más ni menos de dos como tope. Para reemplazar a uno hay que desactivarlo antes. La regla vale al crear, al reactivar y al mover de sucursal.
- Los empleados activos de una sucursal no pueden superar su **cupo** (`maxEmpleados`, 3 por defecto). Bajar el cupo no borra a nadie: solo bloquea nuevas altas.
- El personal (encargados y empleados) usa mail **`@burgerfast.com`**, exclusivo: un cliente no puede registrarse con ese dominio. El master queda exento.
- El nombre de un administrador lleva nombre y apellido en un solo campo, de 3 a 40 caracteres.
- **Suspensión de productos:** un producto se vende en una sucursal si está activo, no tiene una suspensión activa allí y hay stock de su receta. El encargado suspende con un motivo obligatorio; queda quién y cuándo (tabla `SuspensionProductos`, con historial: rehabilitar no borra). El master puede deshabilitar un producto en una sucursal sin plazo, o en todas con `Producto.disponible`. El encargado levanta solo lo que suspendió él; el master levanta cualquier suspensión, incluida la del encargado, pero el encargado no puede levantar lo que deshabilitó el master.
- Si falta un insumo (o se echó a perder: Stock → "Reportar baja", con motivo), los productos que lo usan se bloquean solos en esa sucursal.
- **Abierta o cerrada:** la app decide sola según el día y el rango de horarios de la sucursal. Encima, el encargado puede cerrarla temporalmente por una contingencia (falta de agua o luz, etc.) escribiendo un motivo; queda quién y cuándo (tabla `CierresSucursales`, con historial). La reabre el encargado o el master, que puede levantar cualquier cierre. El master no puede cerrarla: lo definitivo es `Sucursal.activa`. Al cerrar o reabrir se avisa al master, a los empleados y al otro encargado de esa sucursal (menos a quien lo hizo). Los pedidos ya tomados siguen su curso y el cliente ve "cerrada temporalmente" sin el motivo.
- **Partes y notificaciones:** el empleado le da un parte a los encargados de su sucursal; cada encargado recibe un aviso en la campanita (el panel consulta cada 30 s). Al abrir el aviso el parte pasa a VISTO, y cuando un encargado lo resuelve (con una nota opcional) a RESUELTO, y el empleado recibe el aviso. Si el parte lista productos, el encargado puede suspenderlos desde ahí.
- **Horario de la sucursal:** el master lo edita siempre. Cada sucursal tiene una perilla (`Sucursal.encargadoEditaHorario`, encendida por defecto en todas) que decide si sus encargados también pueden editarlo, con los mismos días y horas que el master. Apagada, el encargado ve el horario en solo lectura en "Mi sucursal". El backend rechaza con 403 el cambio de un encargado si la perilla está apagada. El resto de los datos de la sucursal es siempre solo del master.

## Dónde se aplican

- Backend: `src/config/roles.js`, `src/utils/permisosAdmin.js`, `src/utils/emailPersonal.js`, `src/middleware/admin/` y `src/controllers/admin/adminController.js`.
- Panel: `admin/src/config/menu.ts` (menú por rol) y `admin/src/components/PermisoRol.tsx` (rutas).
- El backend vuelve a comprobar cada acción: ocultar un botón en el panel no es una protección.
