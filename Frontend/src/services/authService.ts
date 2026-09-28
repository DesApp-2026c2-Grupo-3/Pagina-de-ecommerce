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

// El backend responde siempre el mismo mensaje (no revela si el email ya tenía cuenta)
export const register = async (data: RegisterData): Promise<string> => {
  const respuesta = await httpClient<{ mensaje: string }>('/usuario', {
    method: 'POST',
    body: JSON.stringify({
      nombre: data.name,
      email: data.email,
      password: data.password,
    }),
  })
  return respuesta.mensaje
}