import { useCallback } from 'react'
import type { FiltroEstadoViaje } from '../../types/viaje.types'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_ESTADO, PARAM_PAGINA, PARAM_SUCURSAL } from '../../utils/navegacion/parametros'
import { esFiltroEstadoViaje } from '../../utils/viajes/estadoViaje'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de la lista de viajes en la URL (?estado=&buscar=&pagina=&sucursal=):
// al volver del detalle de un viaje, o al recargar, la vista queda igual.
export function useFiltrosViajesUrl() {
  const { searchParams, actualizar } = useParametrosUrl()

  const estadoUrl = searchParams.get(PARAM_ESTADO)
  const estado: FiltroEstadoViaje = esFiltroEstadoViaje(estadoUrl) ? estadoUrl : 'todos'
  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1
  // Solo lo usa el MASTER (RN-35)
  const sucursal = leerIdPositivo(searchParams.get(PARAM_SUCURSAL))

  // Cambiar un filtro vuelve a la primera página
  const setEstado = useCallback(
    (valor: FiltroEstadoViaje) =>
      actualizar({ [PARAM_ESTADO]: valor === 'todos' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setSucursal = useCallback(
    (id: number) => actualizar({ [PARAM_SUCURSAL]: String(id), [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return {
    estado,
    busqueda,
    pagina,
    sucursal,
    hayFiltros: estado !== 'todos' || busqueda.trim() !== '',
    setEstado,
    setBusqueda,
    setSucursal,
    setPagina,
  }
}
