import { apiFetch } from './httpClient'

import type { ViajeActivo, RespuestaIniciarViaje, ViajeHistorial } from '../types/viaje.types'


export const iniciarViaje = (pedidoIds: number[]) => {
  return apiFetch<RespuestaIniciarViaje>('/repartidor/viajes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pedidoIds }),
  })
}


export const obtenerViajeActivo = () => {
  return apiFetch<ViajeActivo | null>('/repartidor/viajes/activo')
}

export const obtenerHistorialViajes = () => {
  return apiFetch<ViajeHistorial[]>('/repartidor/viajes/historial')
}