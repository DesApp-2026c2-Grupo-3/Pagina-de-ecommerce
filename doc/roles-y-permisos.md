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
| Productos, categorías, insumos | sí | no | no |
| Crear, editar y desactivar sucursales | sí | no | no |
| Editar su propia sucursal | sí | sí (menos el cupo) | no |
| Definir el cupo de empleados de una sucursal | sí | no | no |
| Crear, editar, desactivar y reactivar encargados | sí | no | no |
| Crear, editar, desactivar y reactivar empleados | sí | solo los de su sucursal | no |

## Reglas de negocio

- Cada sucursal tiene **2 encargados activos**, ni más ni menos de dos como tope. Para reemplazar a uno hay que desactivarlo antes. La regla vale al crear, al reactivar y al mover de sucursal.
- Los empleados activos de una sucursal no pueden superar su **cupo** (`maxEmpleados`, 3 por defecto). Bajar el cupo no borra a nadie: solo bloquea nuevas altas.
- El personal (encargados y empleados) usa mail **`@burgerfast.com`**, exclusivo: un cliente no puede registrarse con ese dominio. El master queda exento.
- El nombre de un administrador lleva nombre y apellido en un solo campo, de 3 a 40 caracteres.

## Dónde se aplican

- Backend: `src/config/roles.js`, `src/utils/permisosAdmin.js`, `src/utils/emailPersonal.js`, `src/middleware/admin/` y `src/controllers/admin/adminController.js`.
- Panel: `admin/src/config/menu.ts` (menú por rol) y `admin/src/components/PermisoRol.tsx` (rutas).
- El backend vuelve a comprobar cada acción: ocultar un botón en el panel no es una protección.
