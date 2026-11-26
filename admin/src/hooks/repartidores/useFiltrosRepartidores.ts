import { useState } from 'react'
import type { FiltroEstadoRepartidor } from '../../utils/repartidores/estadoRepartidor'

// Búsqueda, sucursal (solo MASTER), estado y página. Cambiar un filtro vuelve a la página 1.
export function useFiltrosRepartidores() {
  const [busqueda, setBusquedaEstado] = useState('')
  const [sucursalId, setSucursalIdEstado] = useState<number | null>(null)
  const [estado, setEstadoEstado] = useState<FiltroEstadoRepartidor>('todos')
  const [pagina, setPagina] = useState(1)

  return {
    busqueda,
    sucursalId,
    estado,
    pagina,
    setPagina,
    setBusqueda: (valor: string) => {
      setBusquedaEstado(valor)
      setPagina(1)
    },
    setSucursalId: (valor: number | null) => {
      setSucursalIdEstado(valor)
      setPagina(1)
    },
    setEstado: (valor: FiltroEstadoRepartidor) => {
      setEstadoEstado(valor)
      setPagina(1)
    },
    hayFiltros: busqueda.trim() !== '' || sucursalId !== null || estado !== 'todos',
  }
}
