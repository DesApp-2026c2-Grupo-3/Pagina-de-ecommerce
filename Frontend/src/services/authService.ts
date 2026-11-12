import { httpClient } from './httpClient'
import type {
  LoginCredentials,
  RegisterData,
  User,
} from '../types/user'
import type {
  RespuestaLoginCliente,
  SesionCliente,
} from '../types/sesion.types'

function mapUsuario(u: RespuestaLoginCliente): User {
  return { id: u.id, name: u.nombre, email: u.email }
}

export const login = async (
  credentials: LoginCredentials,
): Promise<SesionCliente> => {
  const respuesta = await httpClient<RespuestaLoginCliente>('/usuario/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })

  if (typeof respuesta?.token !== 'string' || !respuesta.token.trim()) {
    throw new Error('El servidor devolvió una sesión inválida')
  }

  return {
    user: mapUsuario(respuesta),
    token: respuesta.token.trim(),
  }
}

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
