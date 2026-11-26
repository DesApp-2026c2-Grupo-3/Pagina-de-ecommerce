import { useRefrescoEnTiempoReal } from '../useRefrescoEnTiempoReal'

interface Opciones {
  pedidoId: number | null
  // Se conoce cuando carga el detalle; antes no se filtra por sucursal
  sucursalId: number | null | undefined
  pausado: boolean
  onRefrescar: () => void | Promise<void>
}

// Refresca el detalle cuando otro actor cambia ESE pedido (repartidor, otro admin),
// al reconectar el socket o al volver a la pestaña. Los refrescos de otros pedidos se ignoran.
export function usePedidoDetalleEnTiempoReal({
  pedidoId,
  sucursalId,
  pausado,
  onRefrescar,
}: Opciones) {
  useRefrescoEnTiempoReal({
    dominios: ['pedidos'],
    sucursalId: sucursalId ?? undefined,
    debounceMs: 350,
    pausado: pausado || pedidoId === null,
    revalidarAlReconectar: true,
    revalidarAlVolverVisible: true,
    onRefrescar: (_evento, eventos) => {
      // Sin eventos = reconexión o pestaña visible otra vez: siempre se revalida
      const afecta =
        eventos.length === 0 ||
        eventos.some(
          (evento) =>
            evento.recursos?.pedidoId === undefined ||
            evento.recursos.pedidoId === pedidoId,
        )
      if (afecta) return onRefrescar()
    },
  })
}
