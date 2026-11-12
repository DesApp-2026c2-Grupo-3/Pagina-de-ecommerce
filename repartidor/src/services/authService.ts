import { apiFetch } from './httpClient'

import type {Repartidor} from '../types/repartidor.types' 

export const iniciarSesion = async ( email: string, password: string): Promise<Repartidor> => {
  return apiFetch<Repartidor>('/repartidor/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })
}

export const cerrarSesion = async (): Promise<void> => {
  await apiFetch('/repartidor/logout', {
    method: 'POST',
  })
}

export const obtenerSesion = async (): Promise<Repartidor> => {
  return apiFetch<Repartidor>('/repartidor/me')
}