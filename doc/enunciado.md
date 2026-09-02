# Especificación de Requerimientos: Plataforma de Delivery para Cadena de Comida Rápida

## Descripción General
Una importante cadena de comida rápida (análoga a McDonald’s, Burger King, Mostaza o similar) desea desarrollar una nueva plataforma digital para la gestión integral de pedidos de delivery.

La solución deberá contemplar:
- **Aplicación para clientes:** para realizar pedidos.
- **Sistema administrativo:** para gestionar la información necesaria para el funcionamiento del negocio.
- **Aplicación para repartidores (Opcional):** a elección del grupo.

Todas las aplicaciones deberán compartir la **misma base de datos**.
Se deberá contemplar el proceso completo desde la configuración de productos hasta la entrega del pedido al cliente.

---

## Funcionalidades Base
La implementación debe contemplar, como mínimo, los puntos que se describen a continuación.

### 1. Gestión de Usuarios
Existen distintos tipos de usuarios en el sistema:

#### Clientes
Son quienes realizan pedidos mediante la aplicación. Podrán:
- Registrarse.
- Iniciar sesión.
- Recuperar contraseña.
- Modificar sus datos personales.
- Administrar sus direcciones de entrega.
- Consultar pedidos anteriores.
- Realizar nuevos pedidos.

#### Administradores
Gestionan toda la información necesaria para el funcionamiento del sistema.
- El sistema nace con un administrador inicial.
- Los administradores podrán crear nuevos administradores.

### 2. Gestión de Sucursales
Cada sucursal representa un local físico. De cada una interesa registrar, entre otros datos:
- Nombre
- Dirección
- Ubicación geográfica (latitud y longitud)
- Horarios de atención
- Teléfono
- Estado (activa/inactiva)

**Asignación de Sucursal:**
La aplicación deberá determinar desde qué sucursal preparar un pedido. Queda a criterio de cada grupo definir la estrategia utilizada para dicha asignación. Algunos ejemplos podrían ser:
- Sucursal más cercana.
- Menor tiempo estimado.
- Disponibilidad de stock.
- Menor cantidad de pedidos pendientes.
- Combinación de varios criterios.

### 3. Catálogo de Productos
Los administradores podrán gestionar el catálogo de productos.
- **Datos del producto:** nombre, descripción, categoría, precio, imagen, estado (disponible/no disponible).
- **Categorías administrables:** (Ejemplos: Hamburguesas, Combos, Papas, Nuggets, Bebidas, Postres, Salsas).
- **Configuraciones especiales:** Cada grupo deberá definir si algunos productos pueden tener configuraciones (Ej: ingredientes adicionales, eliminación de ingredientes, tamaños, sabores, promociones).

### 4. Carrito de Compras
Los clientes podrán ir agregando productos al carrito.
- Para cada producto incluido se debe poder indicar: **cantidad, observaciones y configuraciones especiales** (si correspondiera).
- La aplicación calculará el importe total.
- El cliente podrá modificar el carrito antes de confirmar el pedido.

### 5. Realización de Pedidos
Al confirmar el pedido se deberán registrar, como mínimo: `cliente`, `sucursal asignada`, `dirección de entrega`, `fecha y hora`, `detalle de productos`, `importe` y `estado inicial`.

Cada pedido atravesará diferentes **estados**, por ejemplo:
1. Pendiente
2. Confirmado
3. En preparación
4. Listo para entregar
5. En camino
6. Entregado
7. Cancelado

*(Los grupos podrán proponer variantes sobre esta lista de estados, si lo consideran conveniente).*

### 6. Geolocalización
Cada cliente podrá registrar una o varias direcciones. 
- Además de la dirección textual deberá almacenarse la **ubicación geográfica**.
- La aplicación utilizará dicha información para determinar desde qué sucursal preparar el pedido y mostrar al cliente las sucursales disponibles.
- **Opcional:** Mostrar un mapa con la ubicación del cliente, sucursal asignada y recorrido estimado (No es obligatorio implementar navegación real).

### 7. Seguimiento del Pedido
Una vez confirmado el pedido, el cliente podrá consultar su evolución. El sistema mostrará:
- Qué sucursal está preparando / preparó el pedido.
- Estado actual.
- Fecha y hora de cada cambio de estado.
- Tiempo estimado de entrega *(Cada grupo podrá definir cómo calcula dicho tiempo)*.

### 8. Historial
Los clientes podrán consultar su historial:
- Pedidos realizados y detalle de cada uno.
- Importe, fecha y estado final.
- Opción para **repetir pedidos anteriores**.

---

## Sistema Administrativo
Los administradores disponen de una aplicación independiente que comparte la misma base de datos con el sistema de delivery.

Desde allí podrán administrar mediante operaciones de alta, baja, modificación y consulta **(CRUD/ABM)** las siguientes entidades:
- Productos
- Categorías
- Promociones
- Sucursales
- Stock
- Administradores
- Estados generales
- Parámetros del sistema

*(Los grupos podrán incorporar configuraciones adicionales que consideren necesarias).*

---

## Reportes
El sistema administrativo deberá ofrecer, al menos, las siguientes consultas y estadísticas relacionadas a **Productos**:
- Productos más vendidos.
- Productos menos vendidos.
- Productos sin stock.
- Productos con mayor facturación.