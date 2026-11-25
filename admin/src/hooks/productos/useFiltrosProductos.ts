import { useCallback } from 'react'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_CATEGORIA, PARAM_DISPONIBILIDAD, PARAM_PAGINA } from '../../utils/navegacion/parametros'
import { esFiltroDisponibilidad, type FiltroDisponibilidad } from '../../utils/productos/filtrarProductos'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de la lista de productos en la URL (?buscar=&categoria=&disponibilidad=&pagina=):
// al volver de «Ver stock» o al recargar, la lista queda igual. Cambiar un filtro vuelve a la página 1.
export function useFiltrosProductos() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const categoria = searchParams.get(PARAM_CATEGORIA) ?? 'todas'
  const disponibilidadUrl = searchParams.get(PARAM_DISPONIBILIDAD)
  const disponibilidad: FiltroDisponibilidad = esFiltroDisponibilidad(disponibilidadUrl) ? disponibilidadUrl : 'todas'
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setCategoria = useCallback(
    (valor: string) => actualizar({ [PARAM_CATEGORIA]: valor === 'todas' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setDisponibilidad = useCallback(
    (valor: FiltroDisponibilidad) =>
      actualizar({ [PARAM_DISPONIBILIDAD]: valor === 'todas' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return {
    busqueda,
    categoria,
    disponibilidad,
    pagina,
    hayFiltros: busqueda.trim() !== '' || categoria !== 'todas' || disponibilidad !== 'todas',
    setBusqueda,
    setCategoria,
    setDisponibilidad,
    setPagina,
  }
}
