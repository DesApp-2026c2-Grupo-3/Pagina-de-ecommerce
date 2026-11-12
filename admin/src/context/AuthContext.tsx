import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import {
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  leerSesion,
  leerToken,
  limpiarSesion,
} from '../utils/sesion'
import { desconectarSocketAdmin } from '../realtime/socketClient'
import { limpiarBusRealtime } from '../realtime/realtimeBus'

interface AuthContextType {
  administrador: AdministradorSesion | null
  token: string | null
  isAuthenticated: boolean
  iniciarSesion: (administrador: AdministradorSesion, token: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [administrador, setAdministrador] = useState<AdministradorSesion | null>(
    leerSesion,
  )
  const [token, setToken] = useState<string | null>(
    () => (leerSesion() ? leerToken() : null),
  )

  const cerrarSesion = useCallback(() => {
    desconectarSocketAdmin()
    limpiarBusRealtime()
    limpiarSesion()
    setAdministrador(null)
    setToken(null)
  }, [])

  // Si el cliente HTTP detecta un 401, el contexto desconecta y recién después limpia.
  useEffect(() => {
    const alExpirar = () => cerrarSesion()
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () =>
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [cerrarSesion])

  const iniciarSesion = (sesion: AdministradorSesion, nuevoToken: string) => {
    desconectarSocketAdmin()
    limpiarBusRealtime()
    guardarSesion(sesion, nuevoToken)
    setAdministrador(sesion)
    setToken(nuevoToken)
  }

  return (
    <AuthContext.Provider
      value={{
        administrador,
        token,
        isAuthenticated: administrador !== null && token !== null,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}
