import { httpClient } from './httpClient'
import type { UpdateProfileData, User } from '../types/user'

interface UsuarioBackend {
  id: number
  nombre: string
  apellido: string | null
  email: string
  telefono: string | null
  dni: string | null
  fechaNacimiento: string | null
  sucursalId?: number | null
  Sucursal?: { id: number; nombre: string; localidad: string } | null
}



function mapUsuario(u: UsuarioBackend): User {
  return {
    id: u.id,
    name: u.nombre,
    apellido: u.apellido ?? '',
    email: u.email,
    telefono: u.telefono ?? '',
    dni: u.dni ?? '',
    fechaNacimiento: u.fechaNacimiento ?? '',
    sucursalId: u.sucursalId ?? null,
    sucursal: u.Sucursal ?? null,
  }
}

export const getPerfil = async (id: number): Promise<User> => {
  const usuario = await httpClient<UsuarioBackend>(`/usuario/${id}`)
  return mapUsuario(usuario)
}

export const actualizarSucursalPredeterminada = async (
  id: number,
  sucursalId: number,
): Promise<User> => {
  const usuario = await httpClient<UsuarioBackend>(`/usuario/${id}/sucursal`, {
    method: 'PUT',
    body: JSON.stringify({ sucursalId }),
  })

  return mapUsuario(usuario)
}

export const actualizarPerfil = async (
  id: number,
  data: UpdateProfileData,
): Promise<User> => {
  const body: Record<string, string> = {
    nombre: data.name,
    apellido: data.apellido ?? '',
    email: data.email,
    telefono: data.telefono ?? '',
    dni: data.dni ?? '',
    fechaNacimiento: data.fechaNacimiento ?? '',
  }

  if (data.password) {
    body.password = data.password
    body.passwordActual = data.passwordActual ?? ''
  }

  const usuario = await httpClient<UsuarioBackend>(`/usuario/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })

  return mapUsuario(usuario)
}