import { useCallback, useEffect, useState, type ReactNode } from 'react'

import type { Repartidor } from '../types/repartidor.types'
import type { MotivoCierreSesion } from '../types/sesion.types'
import { AuthContext } from './AuthContext'
import { iniciarSesion as pedirLogin, obtenerSesion } from '../services/authService'
import { ErrorApi, suscribirSesionExpirada } from '../services/httpClient'
import { desconectarSocketRepartidor } from '../realtime/socketClient'
import { limpiarBusRealtime } from '../realtime/realtimeBus'
import {
  esSesionRepartidor,
  guardarRepartidor,
  guardarSesion,
  leerSesion,
  limpiarSesion,
} from '../utils/sesion'

export function AuthProvider({ children }: { children: ReactNode }) {
  // Se lee una sola vez al montar: sin token guardado no se llama a /me (plan 5.6)
  const [sesionInicial] = useState(leerSesion)
  const [repartidor, setRepartidor] = useState<Repartidor | null>(sesionInicial?.repartidor ?? null)
  const [token, setToken] = useState<string | null>(sesionInicial?.token ?? null)
  const [cargando, setCargando] = useState(sesionInicial !== null)
  const [motivoCierre, setMotivoCierre] = useState<MotivoCierreSesion | null>(null)

  // Orden obligatorio (plan 5.6): socket → bus → almacenamiento → estado
  const cerrarSesion = useCallback((motivo?: MotivoCierreSesion) => {
    desconectarSocketRepartidor()
    limpiarBusRealtime()
    limpiarSesion()
    setMotivoCierre(motivo ?? null)
    setToken(null)
    setRepartidor(null)
    setCargando(false)
  }, [])

  // Cualquier 401 con token guardado (sesión vencida, repartidor desactivado) cierra la sesión
  useEffect(() => suscribirSesionExpirada(() => cerrarSesion('expirada')), [cerrarSesion])

  // Revalida la sesión guardada al abrir la app
  useEffect(() => {
    if (!sesionInicial) return

    let vigente = true

    obtenerSesion()
      .then((datos) => {
        if (!vigente) return
        guardarRepartidor(datos)
        setRepartidor(datos)
      })
      .catch((error: unknown) => {
        // El 401 ya lo resolvió suscribirSesionExpirada; un corte de red conserva la sesión
        if (!(error instanceof ErrorApi && error.status === 401)) {
          console.error('No se pudo validar la sesión:', error)
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [sesionInicial])

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const sesion = await pedirLogin(email, password)

    if (!esSesionRepartidor(sesion)) {
      throw new Error('Respuesta de inicio de sesión inválida')
    }

    guardarSesion(sesion)
    setMotivoCierre(null)
    setToken(sesion.token)
    setRepartidor(sesion.repartidor)
  }, [])

  return (
    <AuthContext.Provider
      value={{ repartidor, token, cargando, motivoCierre, iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}
