import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import { useAuth } from '../AuthContext'
import {
  AccionesNotificacionesContext,
  EstadoNotificacionesContext,
} from './NotificacionContext'
import { estadoInicial, notificacionReducer } from './notificacionReducer'
import { useValorActual } from '../../hooks/useValorActual'
import { useCargaNotificaciones } from '../../hooks/notificaciones/useCargaNotificaciones'
import { useLecturaNotificaciones } from '../../hooks/notificaciones/useLecturaNotificaciones'
import { useSuscripcionNotificaciones } from '../../hooks/notificaciones/useSuscripcionNotificaciones'
import { useTituloConNoLeidas } from '../../hooks/useTituloConNoLeidas'
import type { AccionesNotificacionesCliente } from '../../types/notificacion.types'

// Estado de la bandeja y acciones estables: cambiar el estado no recrea las acciones (plan, E-6)
export function NotificacionProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [estado, dispatch] = useReducer(notificacionReducer, estadoInicial)
  const tokenRef = useValorActual(token)
  const estadoRef = useValorActual(estado)

  const { cargarInicial, cargarMas } = useCargaNotificaciones({
    token,
    dispatch,
    tokenRef,
    estadoRef,
  })
  const { marcarLeida, marcarTodas } = useLecturaNotificaciones({ dispatch, tokenRef, estadoRef })
  useSuscripcionNotificaciones({ activo: token !== null, dispatch, revalidar: cargarInicial })
  useTituloConNoLeidas(estado.noLeidas)

  // Reintenta solo la carga que falló (plan, B-6)
  const reintentar = useCallback(() => {
    const origen = estadoRef.current.errorCarga?.origen
    if (origen === 'inicial') void cargarInicial()
    if (origen === 'mas') cargarMas()
  }, [cargarInicial, cargarMas, estadoRef])

  const acciones = useMemo<AccionesNotificacionesCliente>(
    () => ({ cargarMas, marcarLeida, marcarTodas, reintentar }),
    [cargarMas, marcarLeida, marcarTodas, reintentar],
  )

  return (
    <EstadoNotificacionesContext.Provider value={estado}>
      <AccionesNotificacionesContext.Provider value={acciones}>
        {children}
      </AccionesNotificacionesContext.Provider>
    </EstadoNotificacionesContext.Provider>
  )
}
