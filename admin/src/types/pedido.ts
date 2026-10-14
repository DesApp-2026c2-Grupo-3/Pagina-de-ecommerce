// Tipos del detalle de pedido del panel de administración.
// Mapean la respuesta de GET /admin/pedidos/:id, incluyendo la línea de tiempo
// (clave `historialDeTiemposPedidos`, pluralizada por Sequelize).

export interface RegistroTiempoPedido {
  id: number
  estado: string
  estadoAnterior: string | null
  fecha: string
}

export interface Personalizacion {
  insumoId: number
  cantidad: number
}

export interface EleccionCombo {
  grupoId: number
  productoId: number
  recargo?: number
}

export interface DetalleLinea {
  id: number
  productoId: number
  cantidad: number
  precio: string | number
  tamanioId: number | null
  personalizaciones: Personalizacion[] | string | null
  combo: { elecciones?: EleccionCombo[] } | string | null
  Producto: { id: number; nombre: string } | null
}

export interface PedidoCompleto {
  id: number
  fecha: string
  estado: string
  total: string | number
  Usuario: { nombre: string; apellido: string; email: string; telefono: string | null } | null
  Direccion: {
    alias: string
    calle: string
    numero: string
    piso: string | null
    localidad: string | null
    provincia: string | null
    observaciones: string | null
    latitud: string | number | null
    longitud: string | number | null
  } | null
  Sucursal: { nombre: string } | null
  DetallePedidos: DetalleLinea[]
  historialDeTiemposPedidos: RegistroTiempoPedido[]
}

// Lo que hace falta del catálogo para traducir ids a nombres
export interface ProductoCatalogo {
  id: number
  nombre: string
  receta?: { insumoId: number; cantidadBase: number }[]
  grupos?: { id: number; nombre: string }[]
}

export interface PropsDetallePedidoModal {
  pedidoId: number | null
  onClose: () => void
}
