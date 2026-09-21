import { httpClient } from './httpClient'
import type { Address, AddressFormData } from '../types/address'

export const getDirecciones = async (usuarioId: number): Promise<Address[]> => {
  return httpClient<Address[]>(`/direcciones/usuario/${usuarioId}`)
}

export const crearDireccion = async (
  usuarioId: number,
  data: AddressFormData,
): Promise<Address> => {
  return httpClient<Address>('/direcciones', {
    method: 'POST',
    body: JSON.stringify({ ...data, usuarioId }),
  })
}

export const actualizarDireccion = async (
  id: number,
  data: AddressFormData,
): Promise<Address> => {
  return httpClient<Address>(`/direcciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const eliminarDireccion = async (id: number): Promise<void> => {
  await httpClient<{ mensaje: string }>(`/direcciones/${id}`, {
    method: 'DELETE',
  })
}