import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { Repartidor } from '../types/repartidor.types'
import {
  iniciarSesion,
  cerrarSesion,
  obtenerSesion,
} from '../services/authService'

interface AuthContextType {
  repartidor: Repartidor | null
  cargando: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [repartidor, setRepartidor] = useState<Repartidor | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const datos = await obtenerSesion()
        setRepartidor(datos)
      } catch {
        setRepartidor(null)
      } finally {
        setCargando(false)
      }
    }

    verificarSesion()
  }, [])

  const login = async (email: string, password: string) => {
    const datos = await iniciarSesion(email, password)
    setRepartidor(datos)
  }

  const logout = async () => {
    try {
      await cerrarSesion()
    } finally {
      setRepartidor(null)
    }
  }

  return (
    <AuthContext.Provider value={{ repartidor, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const contexto = useContext(AuthContext)

  if (!contexto) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return contexto
}