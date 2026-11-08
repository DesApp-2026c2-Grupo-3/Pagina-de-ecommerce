export interface ProductoMasVendido {
  productoId: number
  unidadesVendidas: string | number
  Producto: {
    nombre: string
    imagen: string | null
    categoria: { nombre: string } | null
  }
}

export interface ProductoMenosVendido {
  productoId: number
  nombre: string
  imagen: string | null
  categoria: { nombre: string } | null
  unidadesVendidas: string | number
}

export interface ProductoMayorFacturacion {
  productoId: number
  nombre: string
  imagen: string | null
  categoria: { nombre: string } | null
  facturacion: string | number
}

export interface ProductoSinStock {
  productoId: number
  nombre: string
  imagen: string | null
  sucursalId: number
  sucursalNombre: string
  unidadesDisponibles: number
  insumoLimitante: string | null
}

export interface PedidoPorEstado {
  estado: string
  cantidad: number
}

export interface PedidoPorDia {
  fecha: string
  cantidad: number
}

export interface PedidoPorSucursal {
  sucursalId: number;
  nombre: string;
  cantidad: number;
}

export interface CancelacionPorDia {
  fecha: string
  cantidad: number
}

export interface TiempoPromedioEntrega {
  cantidadPedidos: number
  promedioMinutos: number | null
}

/* ---------- Clientes ---------- */

export type RangoClientes = 'mes' | 'anio' | 'siempre'
export type PeriodoClientes = 'mes' | 'semana'

export interface ClienteMasPedidos {
  usuarioId: number
  nombre: string
  apellido: string | null
  email: string
  clienteDesde: string
  cantidadPedidos: number
  totalGastado: number
  ultimoPedido: string
  sucursalFavorita: string | null
  productoFavorito: string | null
}

export interface ClientesNuevosPorPeriodo {
  inicio: string   // "2026-10-01": primer día del mes o lunes de la semana
  cantidad: number
}

export interface ClienteInactivo {
  usuarioId: number
  nombre: string
  apellido: string | null
  email: string
  ultimoPedido: string
  diasSinPedir: number
  cantidadPedidos: number
  sucursal: string | null
  productoFavorito: string | null
}

/* ---------- Sucursales ---------- */

export type MesVentas = 'anterior' | 'actual'

export interface VentaSucursal {
  sucursalId: number
  nombre: string
  ventas: number   // lo vendido en el mes elegido
  meta: number     // lo vendido el mes anterior
  pedidos: number
}

export interface VentasPorSucursal {
  mes: string               // "2026-10"
  diasDelMes: number
  diaActual: number | null  // solo si es el mes en curso
  sucursales: VentaSucursal[]
}

export interface ProductoDeSucursal {
  productoId: number
  nombre: string
  categoria: string | null
  unidades: number
}

export interface ProductosDeSucursal {
  sucursalId: number
  nombre: string
  productos: ProductoDeSucursal[]
}

export interface PedidosAtendidosSucursal {
  sucursalId: number
  nombre: string
  entregados: number
  promedioMinutos: number | null
}

/* ---------- Promociones ---------- */

export interface PromocionMasUtilizada {
  promocionId: number
  titulo: string
  destacado: string        // "2×1", "20%", "Gratis"
  tipo: string             // SEMANA, REGALO o DIA
  activa: boolean
  veces: number            // pedidos en los que se usó
  unidades: number
  facturacion: number
  ahorro: number           // lo que se ahorraron los clientes
  diaMasUsado: string | null
}

export interface ImpactoPromociones {
  desde: string | null     // primer pedido con promo guardada
  pedidosConPromo: number
  pedidosSinPromo: number
  ventasConPromo: number
  ventasSinPromo: number
  ticketConPromo: number | null
  ticketSinPromo: number | null
  ahorroTotal: number
}

/* ---------- Período de los botones ---------- */

// Últimos 7, 30 o 365 días; null = histórico (todo)
export type PeriodoReporte = 7 | 30 | 365 | null