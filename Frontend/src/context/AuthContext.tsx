import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { login as loginService, register as registerService } from '../services/authService'
import {
  ErrorApi,
  httpClient,
  suscribirSesionExpirada,
} from '../services/httpClient'
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

  // Revalida la sesión guardada contra el backend usando el token activo
  // (GET /usuario/me: el usuario sale del token, nunca del id guardado en el navegador).
  // - 401: token vencido/inválido o el usuario ya no existe (p. ej. la base se recreó).
  //   httpClient avisa a suscribirSesionExpirada y logout() limpia storage, socket y bus.
  // - 404: el usuario del token no existe: se cierra la sesión igual.
  // - Sin conexión o error del servidor: la sesión queda como está.
  // Corre al montar y cada vez que cambia el token (login), no en cada cambio de perfil.
  useEffect(() => {
    if (!token) return
    const controlador = new AbortController()

    httpClient<unknown>('/usuario/me', { signal: controlador.signal }).catch(
      (error: unknown) => {
        if (controlador.signal.aborted) return
        if (error instanceof ErrorApi && error.status === 404) {
          logout()
        }
      },
    )

    return () => controlador.abort()
  }, [logout, token])

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
