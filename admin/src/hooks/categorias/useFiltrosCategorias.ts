import { useCallback } from 'react'
import {
  esFiltroEstadoCategoria,
  type FiltroEstadoCategoria,
} from '../../utils/categorias/filtrarCategorias'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_ESTADO, PARAM_PAGINA } from '../../utils/navegacion/parametros'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de Categorías en la URL (?buscar=&estado=&pagina=): al volver de editar o al recargar,
// la lista queda igual. Habilitadas es el valor por defecto y no se escribe. Cambiar un filtro vuelve a la página 1.
export function useFiltrosCategorias() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const estadoUrl = searchParams.get(PARAM_ESTADO)
  const estado: FiltroEstadoCategoria = esFiltroEstadoCategoria(estadoUrl) ? estadoUrl : 'habilitadas'
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setEstado = useCallback(
    (valor: FiltroEstadoCategoria) =>
      actualizar({ [PARAM_ESTADO]: valor === 'habilitadas' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return { busqueda, estado, pagina, setBusqueda, setEstado, setPagina }
}
