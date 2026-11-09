import { useRefrescoEnTiempoReal } from './useRefrescoEnTiempoReal'

interface OpcionesStock {
  sucursalId: number
  pausado?: boolean
  onRefrescar: () => void | Promise<void>
}

export function useStockEnTiempoReal({
  sucursalId,
  pausado = false,
  onRefrescar,
}: OpcionesStock) {
  useRefrescoEnTiempoReal({
    dominios: ['stock'],
    sucursalId,
    debounceMs: 350,
    pausado,
    revalidarAlReconectar: true,
    revalidarAlVolverVisible: true,
    onRefrescar,
  })
}
