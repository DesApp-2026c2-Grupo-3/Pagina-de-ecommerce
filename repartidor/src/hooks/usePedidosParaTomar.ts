import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { obtenerPedidosDisponibles } from '../services/pedidoService'
import { obtenerViajeActivo } from '../services/viajeService'
import { useRefrescoRepartidor } from './useRefrescoRepartidor'
import type { DominioRefresco } from '../types/realtime.types'

// Cambian los disponibles o cambia su viaje (le asignan uno): una sola recarga para los dos
const DOMINIOS: readonly DominioRefresco[] = ['pedidos_disponibles', 'viaje']

// Plan UX, v1.7: cuántos pedidos puede tomar el repartidor ahora, para el contador de la
// pestaña Pedidos. null: no se muestra (tiene un viaje en curso, así que no puede tomar, o
// todavía no se sabe). Siempre es el número real: si un compañero toma uno, baja.
export function usePedidosParaTomar(): number | null {
  const { pathname } = useLocation()
  const [cantidad, setCantidad] = useState<number | null>(null)

  // Los cambios de estado viven en el callback de la promesa, nunca en el paso del efecto.
  // Si falla, se conserva el último número conocido: es un contador, no un dato crítico.
  const cargar = useCallback(() => {
    Promise.all([obtenerViajeActivo(), obtenerPedidosDisponibles()])
      .then(([viaje, pedidos]) => setCantidad(viaje ? null : pedidos.length))
      .catch(() => {})
  }, [])

  // Al cambiar de pantalla también: así se entera de lo que hizo él mismo (tomar pedidos,
  // terminar el viaje), que no le llega como refresco
  useEffect(() => {
    cargar()
  }, [cargar, pathname])

  // Lo que hacen los demás: el local, el admin o un compañero (y al volver a primer plano)
  useRefrescoRepartidor(DOMINIOS, cargar)

  return cantidad
}
