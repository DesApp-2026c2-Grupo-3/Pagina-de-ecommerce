import { useCallback } from 'react'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_ESTADO, PARAM_PAGINA } from '../../utils/navegacion/parametros'
import { esFiltroEstadoSucursal, type FiltroEstadoSucursal } from '../../utils/sucursales/filtrarSucursales'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de Sucursales en la URL (?buscar=&estado=&pagina=): al volver de «Ver detalles» o «Ver stock»,
// la lista queda igual. Activas es el valor por defecto y no se escribe. Cambiar un filtro vuelve a la página 1.
export function useFiltrosSucursales() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const estadoUrl = searchParams.get(PARAM_ESTADO)
  const estado: FiltroEstadoSucursal = esFiltroEstadoSucursal(estadoUrl) ? estadoUrl : 'activas'
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setEstado = useCallback(
    (valor: FiltroEstadoSucursal) =>
      actualizar({ [PARAM_ESTADO]: valor === 'activas' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return { busqueda, estado, pagina, setBusqueda, setEstado, setPagina }
}
