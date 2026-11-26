import { useCallback } from 'react'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_ESTADO, PARAM_PAGINA, PARAM_TIPO } from '../../utils/navegacion/parametros'
import {
  esFiltroEstadoPromo,
  esFiltroTipoPromo,
  type FiltroEstadoPromo,
  type FiltroTipoPromo,
} from '../../utils/promociones/filtrarPromociones'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de Promociones en la URL (?buscar=&tipo=&estado=&pagina=): al volver de editar o al recargar,
// la lista queda igual. «todos» no se escribe. Cambiar un filtro vuelve a la página 1.
export function useFiltrosPromociones() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const tipoUrl = searchParams.get(PARAM_TIPO)
  const tipo: FiltroTipoPromo = esFiltroTipoPromo(tipoUrl) ? tipoUrl : 'todos'
  const estadoUrl = searchParams.get(PARAM_ESTADO)
  const estado: FiltroEstadoPromo = esFiltroEstadoPromo(estadoUrl) ? estadoUrl : 'todos'
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setTipo = useCallback(
    (valor: FiltroTipoPromo) => actualizar({ [PARAM_TIPO]: valor === 'todos' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setEstado = useCallback(
    (valor: FiltroEstadoPromo) => actualizar({ [PARAM_ESTADO]: valor === 'todos' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return {
    busqueda,
    tipo,
    estado,
    pagina,
    hayFiltros: busqueda.trim() !== '' || tipo !== 'todos' || estado !== 'todos',
    setBusqueda,
    setTipo,
    setEstado,
    setPagina,
  }
}
