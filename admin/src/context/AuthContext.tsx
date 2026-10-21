import { createContext, useContext, useEffect, useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import {
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  leerSesion,
  limpiarSesion,
} from '../utils/sesion'

interface AuthContextType {
  administrador: AdministradorSesion | null
  isAuthenticated: boolean
  iniciarSesion: (administrador: AdministradorSesion) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [administrador, setAdministrador] = useState<AdministradorSesion | null>(
    leerSesion,
  )

  // Si el cliente HTTP detecta un 401, limpia el storage y avisa acá.
  useEffect(() => {
    const alExpirar = () => setAdministrador(null)
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
    return () =>
      window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  }, [])

  const iniciarSesion = (sesion: AdministradorSesion) => {
    guardarSesion(sesion)
    setAdministrador(sesion)
  }

  const cerrarSesion = () => {
    limpiarSesion()
    setAdministrador(null)
  }

  return (
    <AuthContext.Provider
      value={{
        administrador,
        isAuthenticated: administrador !== null,
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
