import { httpClient } from './httpClient'
import type { UpdateProfileData, User } from '../types/user'

interface UsuarioBackend {
  id: number
  nombre: string
  email: string
  telefono: string | null
  direccion: string | null
}

function mapUsuario(u: UsuarioBackend): User {
  return {
    id: u.id,
    name: u.nombre,
    email: u.email,
    telefono: u.telefono ?? '',
    direccion: u.direccion ?? '',
  }
}

export const getPerfil = async (id: number): Promise<User> => {
  const usuario = await httpClient<UsuarioBackend>(`/usuario/${id}`)
  return mapUsuario(usuario)
}

export const actualizarPerfil = async (
  id: number,
  data: UpdateProfileData,
): Promise<User> => {
  const body: Record<string, string> = {
    nombre: data.name,
    email: data.email,
    telefono: data.telefono ?? '',
    direccion: data.direccion ?? '',
  }

  if (data.password) {
    body.password = data.password
  }

  console.log('Enviando al backend:', body) 
  const usuario = await httpClient<UsuarioBackend>(`/usuario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

  return mapUsuario(usuario)
}