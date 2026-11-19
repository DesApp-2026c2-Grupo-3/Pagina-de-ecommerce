import { useRefrescoEnTiempoReal } from './useRefrescoEnTiempoReal'

interface OpcionesViajes {
  sucursalId: number | null
  pausado?: boolean
  onRefrescar: () => void | Promise<void>
}

// Recarga el panel de viajes cuando un repartidor toma, retira, inicia, entrega o pide ayuda
export function useViajesEnTiempoReal({
  sucursalId,
  pausado = false,
  onRefrescar,
}: OpcionesViajes) {
  useRefrescoEnTiempoReal({
    dominios: ['viajes'],
    sucursalId: sucursalId ?? 0,
    debounceMs: 350,
    pausado: pausado || sucursalId === null,
    revalidarAlReconectar: true,
    revalidarAlVolverVisible: true,
    onRefrescar,
  })
}
