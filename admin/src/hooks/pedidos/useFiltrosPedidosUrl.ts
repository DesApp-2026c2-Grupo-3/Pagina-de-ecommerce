import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FiltroEtapa } from '../../types/pedido.types'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import {
  PARAM_BUSQUEDA,
  PARAM_ETAPA,
  PARAM_PAGINA,
  PARAM_SUCURSAL,
} from '../../utils/navegacion/parametros'
import { esFiltroEtapa } from '../../utils/pedidos/filtrarPedidos'

// Filtros de la lista guardados en la URL (?etapa=&buscar=&pagina=&sucursal=):
// al volver del detalle, o al recargar, la vista queda igual.
// Se usa `replace` para no llenar el historial mientras se escribe.
export function useFiltrosPedidosUrl() {
  const [searchParams, setSearchParams] = useSearchParams()

  const etapaUrl = searchParams.get(PARAM_ETAPA)
  const etapa: FiltroEtapa = esFiltroEtapa(etapaUrl) ? etapaUrl : 'todas'
  const busqueda = searchParams.get(PARAM_BUSQUEDA) ?? ''
  const pagina = leerIdPositivo(searchParams.get(PARAM_PAGINA)) ?? 1
  // Solo lo usa el MASTER: el admin de sucursal siempre ve la suya (RN-35)
  const sucursal = leerIdPositivo(searchParams.get(PARAM_SUCURSAL))

  // null o vacío = quitar el parámetro (vuelve al valor por defecto)
  const actualizar = useCallback(
    (cambios: Record<string, string | null>) => {
      setSearchParams(
        (previos) => {
          const siguientes = new URLSearchParams(previos)
          for (const [clave, valor] of Object.entries(cambios)) {
            if (valor === null || valor === '') siguientes.delete(clave)
            else siguientes.set(clave, valor)
          }
          return siguientes
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  // Cambiar un filtro vuelve a la primera página
  const setEtapa = useCallback(
    (valor: FiltroEtapa) =>
      actualizar({ [PARAM_ETAPA]: valor === 'todas' ? null : valor, [PARAM_PAGINA]: null }),
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
    etapa,
    busqueda,
    pagina,
    sucursal,
    hayFiltros: etapa !== 'todas' || busqueda.trim() !== '',
    setEtapa,
    setBusqueda,
    setSucursal,
    setPagina,
  }
}
