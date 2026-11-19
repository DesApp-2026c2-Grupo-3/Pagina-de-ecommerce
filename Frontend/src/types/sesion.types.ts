import type { User } from './user'

export interface RespuestaLoginCliente {
  id: number
  nombre: string
  email: string
  token: string
}

export interface SesionCliente {
  user: User
  token: string
}
