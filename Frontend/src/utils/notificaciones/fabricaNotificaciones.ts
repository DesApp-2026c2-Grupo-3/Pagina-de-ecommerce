import type {
  BaseNotificacion,
  DatosPedidoCreado,
  DatosPedidoEstadoCambiado,
  DatosSucursalCerrada,
  DescripcionNotificacionCliente,
  NotificacionCliente,
  TipoNotificacionCliente,
} from '../../types/notificacion.types'
import { formatearPrecio } from '../precio'
import { esEstadoInterno, normalizarEstado } from '../../config/pedidoEstados'
import {
  esRegistro,
  esTipoNotificacionCliente,
  fechaIso,
  numeroNoNegativo,
  numeroPositivo,
  textoNoVacio,
} from './validaciones'

type NotificacionPedidoCreado = Extract<
  NotificacionCliente,
  { tipo: 'pedido.creado' }
>
type NotificacionPedidoEstadoCambiado = Extract<
  NotificacionCliente,
  { tipo: 'pedido.estado_cambiado' }
>
type NotificacionSucursalCerrada = Extract<
  NotificacionCliente,
  { tipo: 'sucursal.cerrada' }
>

export interface EstrategiaNotificacionCliente<
  T extends NotificacionCliente = NotificacionCliente,
> {
  tipo: T['tipo']
  crear(base: BaseNotificacion, datos: unknown): T | null
  describir(notificacion: T): DescripcionNotificacionCliente
  obtenerDestino(notificacion: T): string | null
}

function leerBase(payload: unknown): BaseNotificacion & {
  tipo: TipoNotificacionCliente
  datos: unknown
} | null {
  if (!esRegistro(payload)) return null

  const id = numeroPositivo(payload.id)
  const tipo = payload.tipo
  const ocurridoEn = fechaIso(payload.ocurridoEn)

  if (id === null || !esTipoNotificacionCliente(tipo) || !ocurridoEn) {
    return null
  }

  if (payload.version !== 1) return null

  const leida = typeof payload.leida === 'boolean' ? payload.leida : false
  let leidaEn: string | null = null

  if (payload.leidaEn !== null && payload.leidaEn !== undefined) {
    leidaEn = fechaIso(payload.leidaEn)
    if (!leidaEn) return null
  }

  return {
    id,
    tipo,
    datos: payload.datos,
    version: 1,
    ocurridoEn,
    leida,
    leidaEn,
  }
}

function leerPedidoComun(datos: unknown) {
  if (!esRegistro(datos)) return null

  const pedidoId = numeroPositivo(datos.pedidoId)
  const usuarioId = numeroPositivo(datos.usuarioId)
  const sucursalId = numeroPositivo(datos.sucursalId)
  const estado = textoNoVacio(datos.estado)
  const total = numeroNoNegativo(datos.total)
  const fecha = fechaIso(datos.fecha)
  const estadoAnterior = textoNoVacio(datos.estadoAnterior)

  if (
    pedidoId === null ||
    usuarioId === null ||
    sucursalId === null ||
    estado === null ||
    total === null ||
    fecha === null
  ) {
    return null
  }

  return {
    pedidoId,
    usuarioId,
    sucursalId,
    estadoAnterior,
    estado,
    total,
    fecha,
  }
}

const estrategiaPedidoCreado: EstrategiaNotificacionCliente<NotificacionPedidoCreado> = {
  tipo: 'pedido.creado',
  crear(base, datos) {
    const pedido = leerPedidoComun(datos)
    if (!pedido) return null

    const datosPedido: DatosPedidoCreado = pedido
    return { ...base, tipo: 'pedido.creado', datos: datosPedido }
  },
  describir(notificacion) {
    return {
      titulo: `Pedido #${notificacion.datos.pedidoId} confirmado`,
      detalle: `Total ${formatearPrecio(notificacion.datos.total)}`,
      tono: 'pedido',
    }
  },
  obtenerDestino(notificacion) {
    return `/pedidos/${notificacion.datos.pedidoId}`
  },
}

const estrategiaPedidoEstadoCambiado: EstrategiaNotificacionCliente<NotificacionPedidoEstadoCambiado> = {
  tipo: 'pedido.estado_cambiado',
  crear(base, datos) {
    const pedido = leerPedidoComun(datos)
    if (!pedido) return null
    // Estados internos local/repartidor ("Listo para retirar"): el cliente no los ve.
    // El backend ya no los envía; esto descarta los que hayan quedado guardados.
    if (esEstadoInterno(pedido.estado)) return null

    const datosPedido: DatosPedidoEstadoCambiado = pedido
    return {
      ...base,
      tipo: 'pedido.estado_cambiado',
      datos: datosPedido,
    }
  },
  describir(notificacion) {
    const anteriorCrudo = notificacion.datos.estadoAnterior
    // "Listo para retirar" → "En proceso" (lo que el cliente vio por última vez)
    const anterior =
      anteriorCrudo && esEstadoInterno(anteriorCrudo)
        ? normalizarEstado(anteriorCrudo)
        : anteriorCrudo
    return {
      titulo: `Pedido #${notificacion.datos.pedidoId}: ${notificacion.datos.estado}`,
      detalle: anterior ? `Antes estaba en ${anterior}` : null,
      tono: 'estado',
    }
  },
  obtenerDestino(notificacion) {
    return `/pedidos/${notificacion.datos.pedidoId}`
  },
}

const estrategiaSucursalCerrada: EstrategiaNotificacionCliente<NotificacionSucursalCerrada> = {
  tipo: 'sucursal.cerrada',
  crear(base, datos) {
    if (!esRegistro(datos)) return null

    const sucursalId = numeroPositivo(datos.sucursalId)
    const sucursalNombre = textoNoVacio(datos.sucursalNombre)

    if (sucursalId === null || sucursalNombre === null) return null

    const datosSucursal: DatosSucursalCerrada = { sucursalId, sucursalNombre }
    return { ...base, tipo: 'sucursal.cerrada', datos: datosSucursal }
  },
  describir(notificacion) {
    return {
      titulo: `${notificacion.datos.sucursalNombre} cerró`,
      detalle: 'No se pueden generar pedidos por ahora.',
      tono: 'sucursal',
    }
  },
  obtenerDestino() {
    return null
  },
}

export class FabricaNotificacionesCliente {
  private estrategias = new Map<
    TipoNotificacionCliente,
    EstrategiaNotificacionCliente
  >()

  registrar(estrategia: EstrategiaNotificacionCliente) {
    this.estrategias.set(estrategia.tipo, estrategia)
    return this
  }

  obtener(tipo: TipoNotificacionCliente) {
    return this.estrategias.get(tipo) ?? null
  }

  crear(payload: unknown): NotificacionCliente | null {
    if (!esRegistro(payload)) return null

    const base = leerBase(payload)
    if (!base) return null

    const estrategia = this.obtener(base.tipo)
    if (!estrategia) return null

    return estrategia.crear(base, base.datos)
  }

  describir(
    notificacion: NotificacionCliente,
  ): DescripcionNotificacionCliente {
    const estrategia = this.obtener(notificacion.tipo)
    if (!estrategia) {
      return {
        titulo: 'Notificación',
        detalle: null,
        tono: 'pedido',
      }
    }

    return estrategia.describir(notificacion)
  }

  obtenerDestino(notificacion: NotificacionCliente): string | null {
    return this.obtener(notificacion.tipo)?.obtenerDestino(notificacion) ?? null
  }
}

export const fabricaNotificacionesCliente = new FabricaNotificacionesCliente()
  .registrar(estrategiaPedidoCreado)
  .registrar(estrategiaPedidoEstadoCambiado)
  .registrar(estrategiaSucursalCerrada)
