import { createContext, useContext, useState, type ReactNode } from 'react'
import { login as loginService, register as registerService } from '../services/authService'
import type { LoginCredentials, RegisterData, User } from '../types/user'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<string>
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')

    return savedUser ? JSON.parse(savedUser) : null
  })


  const [loading, setLoading] = useState(false)

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    try {
      const loggedUser = await loginService(credentials)
      setUser(loggedUser)
      localStorage.setItem('user', JSON.stringify(loggedUser))
    } finally {
      setLoading(false)
    }
  }

// Registrarse ya no inicia sesión: el usuario va al login
const register = async (data: RegisterData): Promise<string> => {
  setLoading(true)
  try {
    return await registerService(data)
  } finally {
    setLoading(false)
  }
}

const logout = () => {
  setUser(null)
  localStorage.removeItem('user')
}

  return (
    <AuthContext.Provider
  value={{ user, isAuthenticated: !!user, loading, login, register, logout, setUser }}
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