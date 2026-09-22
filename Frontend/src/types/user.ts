export interface User {
  id: number
  name: string
  apellido?: string
  email: string
  telefono?: string
  dni?: string
  fechaNacimiento?: string
  sucursalId?: number | null
  sucursal?: { id: number; nombre: string; localidad: string } | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface UpdateProfileData {
  name: string
  apellido?: string
  email: string
  telefono?: string
  dni?: string
  fechaNacimiento?: string
  password?: string
  passwordActual?: string
}