import { apiFetch } from './httpClient'

import type { ViajeActivo, RespuestaIniciarViaje, ViajeHistorial, 
  SolicitudAsistencia, RespuestaSolicitudAsistencia, 
  RespuestaCambioEstadoViaje,
  ViajeCreado} from '../types/viaje.types'


export const tomarPedidos = (pedidoIds: number[]) => {
  return apiFetch<RespuestaIniciarViaje>('/repartidor/viajes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pedidoIds }),
  })
}

export const iniciarViaje = () => {
  return apiFetch<RespuestaCambioEstadoViaje>('/repartidor/viajes/iniciar', {
    method: 'PATCH',
  })
}

export const obtenerViajeActivo = () => {
  return apiFetch<ViajeActivo | null>('/repartidor/viajes/activo')
}

export const obtenerHistorialViajes = () => {
  return apiFetch<ViajeHistorial[]>('/repartidor/viajes/historial')
}

export const solicitarAyuda = (datos: SolicitudAsistencia) => {
  return apiFetch<RespuestaSolicitudAsistencia>('/repartidor/viajes/solicitar-ayuda', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datos),
  })
}

export const quitarPedidoDelViaje = (pedidoId: number) =>
  apiFetch<{
    mensaje: string
    pedidoId: number
    pedidosRestantes: number
    viaje: ViajeCreado
  }>(`/repartidor/viajes/pedidos/${pedidoId}`, {
    method: 'DELETE',
  })