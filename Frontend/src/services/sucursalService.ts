import { httpClient } from './httpClient'
import type { Sucursal } from '../types/sucursal'

export const getSucursales = async (): Promise<Sucursal[]> => {
  const sucursales = await httpClient<Sucursal[]>('/sucursales')
  // radioEntregaKm es DECIMAL en la base: Postgres lo devuelve como texto
  return sucursales.map((s) => ({
    ...s,
    latitud: Number(s.latitud),
    longitud: Number(s.longitud),
    radioEntregaKm: Number(s.radioEntregaKm),
  }))
}
