import { useCallback } from 'react'
import { esFiltroRol, type FiltroRol } from '../../utils/administradores/filtrarAdministradores'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_BUSQUEDA, PARAM_PAGINA, PARAM_ROL, PARAM_SUCURSAL } from '../../utils/navegacion/parametros'
import { useParametrosUrl } from '../useParametrosUrl'

// Filtros de Administradores en la URL (?buscar=&rol=&sucursal=&pagina=): al volver de Editar o al recargar,
// la lista queda igual. «todos» / «todas» no se escriben. Cambiar un filtro vuelve a la página 1.
export function useFiltrosAdministradores() {
  const { searchParams, actualizar } = useParametrosUrl()

  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const rolUrl = searchParams.get(PARAM_ROL)
  const rol: FiltroRol = esFiltroRol(rolUrl) ? rolUrl : 'todos'
  const idSucursal = leerIdPositivo(searchParams.get(PARAM_SUCURSAL))
  const sucursal = idSucursal === null ? 'todas' : String(idSucursal)
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1

  const setBusqueda = useCallback(
    (valor: string) => actualizar({ [PARAM_BUSQUEDA]: valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setRol = useCallback(
    (valor: FiltroRol) => actualizar({ [PARAM_ROL]: valor === 'todos' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setSucursal = useCallback(
    (valor: string) => actualizar({ [PARAM_SUCURSAL]: valor === 'todas' ? null : valor, [PARAM_PAGINA]: null }),
    [actualizar],
  )
  const setPagina = useCallback(
    (valor: number) => actualizar({ [PARAM_PAGINA]: valor <= 1 ? null : String(valor) }),
    [actualizar],
  )

  return {
    busqueda,
    rol,
    sucursal,
    pagina,
    hayFiltros: busqueda !== '' || rol !== 'todos' || sucursal !== 'todas',
    setBusqueda,
    setRol,
    setSucursal,
    setPagina,
  }
}
