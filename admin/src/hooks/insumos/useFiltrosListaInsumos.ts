import { useCallback } from 'react'
import { esFiltroEstadoInsumo, type FiltroEstadoInsumo } from '../../utils/insumos/filtrarInsumos'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_ESTADO, PARAM_PAGINA } from '../../utils/navegacion/parametros'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de la lista de Insumos en la URL (?buscar=&estado=&pagina=). Habilitados es el valor
// por defecto y no se escribe. Cambiar un filtro vuelve a la página 1.
export function useFiltrosListaInsumos() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const estadoUrl = searchParams.get(PARAM_ESTADO)
  const estado: FiltroEstadoInsumo = esFiltroEstadoInsumo(estadoUrl) ? estadoUrl : 'habilitados'
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setEstado = useCallback(
    (valor: FiltroEstadoInsumo) =>
      actualizar({ [PARAM_ESTADO]: valor === 'habilitados' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return { busqueda, estado, pagina, setBusqueda, setEstado, setPagina }
}
