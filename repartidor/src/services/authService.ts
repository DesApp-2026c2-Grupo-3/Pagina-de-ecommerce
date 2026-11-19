import { apiFetch } from './httpClient'

import type { Repartidor } from '../types/repartidor.types'
import type { RespuestaLogin } from '../types/sesion.types'

export const iniciarSesion = (email: string, password: string) =>
  apiFetch<RespuestaLogin>('/repartidor/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const obtenerSesion = () => apiFetch<Repartidor>('/repartidor/me')
