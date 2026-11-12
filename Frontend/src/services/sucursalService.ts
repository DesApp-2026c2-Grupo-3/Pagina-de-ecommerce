import { httpClient } from './httpClient'
import { validarHorarioSemana, zonaHorariaDeSucursal } from '../utils/horario'
import type { Sucursal } from '../types/sucursal'

export const getSucursales = async (): Promise<Sucursal[]> => {
  const respuesta = await httpClient<unknown>('/sucursales')
  if (!Array.isArray(respuesta)) {
    throw new Error('La respuesta de /sucursales no es una lista de sucursales')
  }

  return respuesta.map((valor) => {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      throw new Error('La respuesta de /sucursales contiene una sucursal inválida')
    }

    const sucursal = valor as Record<string, unknown>
    const nombre = typeof sucursal.nombre === 'string' ? sucursal.nombre : 'sin nombre'
    const errorHorario = validarHorarioSemana(sucursal.horario)
    if (errorHorario) {
      throw new Error(`La sucursal "${nombre}" no cumple el contrato de horarios: ${errorHorario}`)
    }

    const datos = valor as Sucursal
    // radioEntregaKm es DECIMAL en la base: Postgres lo devuelve como texto
    return {
      ...datos,
      latitud: Number(datos.latitud),
      longitud: Number(datos.longitud),
      radioEntregaKm: Number(datos.radioEntregaKm),
      zona_horaria: zonaHorariaDeSucursal(datos.zona_horaria),
    }
  })
}
