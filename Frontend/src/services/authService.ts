import { mockUsers } from '../mocks/users'
import type { LoginCredentials, RegisterData, User } from '../types/user'

// Simula latencia de red, para que se sienta como un fetch real
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const login = async (credentials: LoginCredentials): Promise<User> => {
  await delay(500)

  const found = mockUsers.find(
    (u) => u.email === credentials.email && u.password === credentials.password,
  )

  if (!found) {
    throw new Error('Email o contraseña incorrectos')
  }

  const { password, ...user } = found
  return user
}

export const register = async (data: RegisterData): Promise<User> => {
  await delay(500)

  const exists = mockUsers.some((u) => u.email === data.email)
  if (exists) {
    throw new Error('Ya existe una cuenta con ese email')
  }

  const newUser = {
    id: mockUsers.length + 1,
    name: data.name,
    email: data.email,
    password: data.password,
  }
  mockUsers.push(newUser)

  const { password, ...user } = newUser
  return user
}