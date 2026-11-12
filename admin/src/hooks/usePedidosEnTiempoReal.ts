import { useRefrescoEnTiempoReal } from './useRefrescoEnTiempoReal'
import type { EventoRefrescoAdmin } from '../types/realtime.types'

interface OpcionesPedidosTiempoReal {
  sucursalId: number | null
  pausado?: boolean
  onRefrescar: (eventos: EventoRefrescoAdmin[]) => void | Promise<void>
}

export function usePedidosEnTiempoReal({
  sucursalId,
  pausado = false,
  onRefrescar,
}: OpcionesPedidosTiempoReal) {
  useRefrescoEnTiempoReal({
    dominios: ['pedidos'],
    sucursalId: sucursalId ?? 0,
    debounceMs: 350,
    pausado: pausado || sucursalId === null,
    revalidarAlReconectar: true,
    revalidarAlVolverVisible: true,
    onRefrescar: (_evento, eventos) => onRefrescar(eventos),
  })
}
