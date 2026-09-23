import { httpClient } from './httpClient'
import type { Sucursal } from '../types/sucursal'

export const getSucursales = async (): Promise<Sucursal[]> => {
  return httpClient<Sucursal[]>('/sucursales')
}
