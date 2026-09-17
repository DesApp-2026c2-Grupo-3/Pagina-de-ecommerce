export interface User {
  id: number
  name: string
  email: string
  telefono?: string  
  direccion?: string
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
  email: string
  telefono?: string
  direccion?: string
  password?: string
}