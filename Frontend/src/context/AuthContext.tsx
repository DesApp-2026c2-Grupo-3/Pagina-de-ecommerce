import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { login as loginService, register as registerService } from '../services/authService'
import { API_URL, suscribirSesionExpirada } from '../services/httpClient'
import type { LoginCredentials, RegisterData, User } from '../types/user'
import {
  guardarSesion,
  leerSesion,
  limpiarSesion,
} from '../utils/sesion'
import { desconectarSocketCliente } from '../realtime/socketClient'
import { limpiarBusRealtime } from '../realtime/realtimeBus'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<string>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesionInicial] = useState(leerSesion)
  const [user, setUserState] = useState<User | null>(
    sesionInicial?.user ?? null,
  )
  const [token, setToken] = useState<string | null>(
    sesionInicial?.token ?? null,
  )
  const [loading, setLoading] = useState(false)

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const sesion = await loginService(credentials)

      desconectarSocketCliente()
      limpiarBusRealtime()
      guardarSesion(sesion)
      setUserState(sesion.user)
      setToken(sesion.token)
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<string> => {
    setLoading(true)
    try {
      return await registerService(data)
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    desconectarSocketCliente()
    limpiarBusRealtime()
    limpiarSesion()
    setUserState(null)
    setToken(null)
  }, [])

  useEffect(() => suscribirSesionExpirada(logout), [logout])

  // Si la base se recreó, el usuario guardado puede no existir más: se cierra la sesión.
  // Solo se cierra con 404/401; si el backend no responde, la sesión queda como está.
  useEffect(() => {
    if (!user) return
    const controlador = new AbortController()

    fetch(`${API_URL}/usuario/${user.id}`, { signal: controlador.signal })
      .then((respuesta) => {
        if (respuesta.status === 404 || respuesta.status === 401) {
          logout()
        }
      })
      .catch((error) => {
        if (error?.name === 'AbortError') return
      })

    return () => controlador.abort()
  }, [logout, user])

  const setUser = (nuevoUsuario: User) => {
    setUserState(nuevoUsuario)

    if (token) {
      guardarSesion({ user: nuevoUsuario, token })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: user !== null && token !== null,
        loading,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
