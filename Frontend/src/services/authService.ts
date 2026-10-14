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

export const solicitarRecuperacion = async (email: string): Promise<string> => {
  const respuesta = await httpClient<{ mensaje: string }>('/usuario/recuperar-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  return respuesta.mensaje
}

export const restablecerPassword = async (
  token: string,
  password: string,
): Promise<string> => {
  const respuesta = await httpClient<{ mensaje: string }>('/usuario/restablecer-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })

  return respuesta.mensaje
}