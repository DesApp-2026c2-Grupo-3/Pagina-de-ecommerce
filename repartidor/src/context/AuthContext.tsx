import { createContext, useContext } from 'react'

import type { Repartidor } from '../types/repartidor.types'
import type { MotivoCierreSesion } from '../types/sesion.types'

export interface AuthContextType {
  repartidor: Repartidor | null
  token: string | null
  // true mientras se valida contra el servidor una sesión guardada
  cargando: boolean
  // Por qué se cerró la última sesión (lo muestra el login)
  motivoCierre: MotivoCierreSesion | null
  iniciarSesion: (email: string, password: string) => Promise<void>
  cerrarSesion: (motivo?: MotivoCierreSesion) => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const contexto = useContext(AuthContext)

  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return contexto
}
