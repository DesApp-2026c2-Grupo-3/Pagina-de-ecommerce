import type {
  DatosPedidoCreado,
  DatosStockBajo,
  DatosSucursalCerrada,
  EventoNotificacionLeida,
  Notificacion,
  TipoNotificacion,
} from '../../types/notificacion.types'

type Registro = Record<string, unknown>

const TIPOS: TipoNotificacion[] = [
  'pedido.creado',
  'sucursal.cerrada',
  'stock.bajo',
]

function esRegistro(valor: unknown): valor is Registro {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

function numeroPositivo(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function numero(valor: unknown): number | null {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor : null
}

function fechaIso(valor: unknown): string | null {
  if (typeof valor !== 'string' && !(valor instanceof Date)) return null

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString()
}

function esTipoNotificacion(valor: unknown): valor is TipoNotificacion {
  return typeof valor === 'string' && TIPOS.includes(valor as TipoNotificacion)
}

function base(valor: unknown) {
  if (!esRegistro(valor) || !esTipoNotificacion(valor.tipo)) return null

  const id = numeroPositivo(valor.id)
  const ocurridoEn = fechaIso(valor.ocurridoEn)
  if (id === null || ocurridoEn === null) return null

  return {
    id,
    tipo: valor.tipo,
    version: numeroPositivo(valor.version) ?? 1,
    ocurridoEn,
    leida: valor.leida === true,
    leidaEn: fechaIso(valor.leidaEn),
  }
}

export function mapearNotificacion(valor: unknown): Notificacion | null {
  const comun = base(valor)
  if (!comun || !esRegistro(valor) || !esRegistro(valor.datos)) return null

  const datos = valor.datos

  if (comun.tipo === 'pedido.creado') {
    const pedidoId = numeroPositivo(datos.pedidoId)
    const usuarioId = numeroPositivo(datos.usuarioId)
    const sucursalId = numeroPositivo(datos.sucursalId)
    const estado = texto(datos.estado)

    if (pedidoId === null || usuarioId === null || sucursalId === null || !estado) {
      return null
    }

    const datosPedido: DatosPedidoCreado = {
      pedidoId,
      usuarioId,
      sucursalId,
      estadoAnterior: null,
      estado,
      total: numero(datos.total) ?? 0,
      fecha: fechaIso(datos.fecha) ?? comun.ocurridoEn,
    }

    return { ...comun, tipo: 'pedido.creado', datos: datosPedido }
  }

  if (comun.tipo === 'sucursal.cerrada') {
    const sucursalId = numeroPositivo(datos.sucursalId)
    if (sucursalId === null) return null

    const datosSucursal: DatosSucursalCerrada = {
      sucursalId,
      sucursalNombre: texto(datos.sucursalNombre) ?? '',
    }

    return { ...comun, tipo: 'sucursal.cerrada', datos: datosSucursal }
  }

  const sucursalId = numeroPositivo(datos.sucursalId)
  const insumoId = numeroPositivo(datos.insumoId)
  if (sucursalId === null || insumoId === null) return null

  const datosStock: DatosStockBajo = {
    sucursalId,
    sucursalNombre: texto(datos.sucursalNombre) ?? '',
    insumoId,
    insumoNombre: texto(datos.insumoNombre) ?? '',
    cantidad: numero(datos.cantidad) ?? 0,
    stockMinimo: datos.stockMinimo === null ? null : numero(datos.stockMinimo),
  }

  return { ...comun, tipo: 'stock.bajo', datos: datosStock }
}

export function mapearEventoLeida(valor: unknown): EventoNotificacionLeida | null {
  if (!esRegistro(valor)) return null

  const leidaEn = fechaIso(valor.leidaEn)
  if (leidaEn === null) return null

  if (valor.todas === true) {
    return { todas: true, leidaEn }
  }

  const notificacionId = numeroPositivo(valor.notificacionId)
  if (notificacionId === null) return null

  return { notificacionId, leidaEn }
}
