import type { User } from '../types/user'

// Simula usuarios ya registrados. password no forma parte del tipo User real
// (nunca se expone al front), por eso la manejamos aparte acá en el mock.
export const mockUsers: (User & { password: string })[] = [
  { id: 1, name: 'Cristian', email: 'cristian@test.com', password: '123456' },
]