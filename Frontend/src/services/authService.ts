import { httpClient } from './httpClient'
import type { LoginCredentials, RegisterData, User } from '../types/user'

// Shape real que devuelve el backend
interface UsuarioBackend {
  id: number
  nombre: string
  email: string
}

function mapUsuario(u: UsuarioBackend): User {
  return { id: u.id, name: u.nombre, email: u.email }
}

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const usuario = await httpClient<UsuarioBackend>('/usuario/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  return mapUsuario(usuario)
}

export const register = async (data: RegisterData): Promise<User> => {
  const usuario = await httpClient<UsuarioBackend>('/usuario', {
    method: 'POST',
    body: JSON.stringify({
      nombre: data.name,
      email: data.email,
      password: data.password,
    }),
  })
  return mapUsuario(usuario)
}