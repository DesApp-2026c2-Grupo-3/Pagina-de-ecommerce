import { useCallback, useEffect, useState } from 'react'

import {
  confirmarRecepcion as pedirConfirmarRecepcion,
  iniciarViaje,
  obtenerViajeActivo,
  quitarPedidoDelViaje,
  solicitarAyuda,
} from '../services/viajeService'
import { entregarPedido, retirarPedido } from '../services/pedidoService'
import { obtenerUbicacionActual } from '../utils/geolocalizacion'
import type { SolicitudAsistencia, ViajeActivo } from '../types/viaje.types'
import { useRefrescoRepartidor } from './useRefrescoRepartidor'

// El viaje en curso del repartidor y sus acciones. Cada acción, si sale bien, vuelve a
// cargar el viaje; si falla, rechaza con el mensaje del servidor para que la pantalla lo muestre.
// Se recarga solo cuando el admin reasigna el viaje o cancela un pedido (refresco "viaje").
export function useViajeActivo() {
  const [viaje, setViaje] = useState<ViajeActivo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Los cambios de estado viven en los callbacks de la promesa (cuando llega la respuesta),
  // nunca en el mismo paso del efecto: mismo patrón que la validación de sesión de AuthProvider
  const cargar = useCallback(
    () =>
      obtenerViajeActivo()
        .then((datos) => {
          setViaje(datos)
          setError('')
        })
        .catch(() => setError('No se pudo obtener la información del viaje.'))
        .finally(() => setCargando(false)),
    [],
  )

  // Primera carga: "cargando" ya arranca en true
  useEffect(() => {
    void cargar()
  }, [cargar])

  const recargarSilencioso = useCallback(() => {
    void cargar()
  }, [cargar])

  useRefrescoRepartidor('viaje', recargarSilencioso)

  // "Actualizar" manual: muestra la carga
  const recargar = useCallback(() => {
    setCargando(true)
    void cargar()
  }, [cargar])

  const accion = useCallback(
    async (ejecutar: () => Promise<unknown>) => {
      await ejecutar()
      await cargar()
    },
    [cargar],
  )

  const retirar = useCallback((pedidoId: number) => accion(() => retirarPedido(pedidoId)), [accion])
  const entregar = useCallback((pedidoId: number) => accion(() => entregarPedido(pedidoId)), [accion])
  const quitar = useCallback((pedidoId: number) => accion(() => quitarPedidoDelViaje(pedidoId)), [accion])
  const iniciar = useCallback(() => accion(iniciarViaje), [accion])
  const confirmarRecepcion = useCallback(() => accion(pedirConfirmarRecepcion), [accion])

  const pedirAyuda = useCallback(
    (datos: SolicitudAsistencia) => accion(async () => {
      const ubicacion = await obtenerUbicacionActual()
      return solicitarAyuda({ ...datos, ...ubicacion })
    }),
    [accion],
  )

  return {
    viaje,
    cargando,
    error,
    recargar,
    retirar,
    entregar,
    quitar,
    iniciar,
    confirmarRecepcion,
    pedirAyuda,
  }
}
