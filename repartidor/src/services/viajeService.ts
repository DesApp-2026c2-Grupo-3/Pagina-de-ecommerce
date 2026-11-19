import { apiFetch } from './httpClient'

import type {
  ViajeActivo,
  ViajeHistorial,
  SolicitudAsistenciaPayload,
  RespuestaSolicitudAsistencia,
  RespuestaCambioEstadoViaje,
  RespuestaTomarPedidos,
  RespuestaQuitarPedido,
  RespuestaConfirmarRecepcion,
} from '../types/viaje.types'

export const tomarPedidos = (pedidoIds: number[]) =>
  apiFetch<RespuestaTomarPedidos>('/repartidor/viajes', {
    method: 'POST',
    body: JSON.stringify({ pedidoIds }),
  })

export const iniciarViaje = () =>
  apiFetch<RespuestaCambioEstadoViaje>('/repartidor/viajes/iniciar', {
    method: 'PATCH',
  })

export const obtenerViajeActivo = () =>
  apiFetch<ViajeActivo | null>('/repartidor/viajes/activo')

export const confirmarRecepcion = () =>
  apiFetch<RespuestaConfirmarRecepcion>('/repartidor/viajes/confirmar-recepcion', {
    method: 'PATCH',
  })

export const obtenerHistorialViajes = () =>
  apiFetch<ViajeHistorial[]>('/repartidor/viajes/historial')

export const solicitarAyuda = (datos: SolicitudAsistenciaPayload) =>
  apiFetch<RespuestaSolicitudAsistencia>('/repartidor/viajes/solicitar-ayuda', {
    method: 'POST',
    body: JSON.stringify(datos),
  })

export const quitarPedidoDelViaje = (pedidoId: number) =>
  apiFetch<RespuestaQuitarPedido>(`/repartidor/viajes/pedidos/${pedidoId}`, {
    method: 'DELETE',
  })
