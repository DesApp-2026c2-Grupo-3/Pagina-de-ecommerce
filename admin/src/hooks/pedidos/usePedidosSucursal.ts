import { useCallback, useEffect, useRef, useState } from 'react'
import { obtenerPedidosPorSucursal } from '../../services/pedidoService'
import type { PedidoFila } from '../../types/pedido.types'
import {
  actualizarPedidoEnCola,
  estadoInicialCola,
  sincronizarCola,
  type EstadoCola,
} from '../../utils/pedidos/colaIngreso'
import { normalizarPedidos } from '../../utils/pedidos/normalizarPedido'

const VACIO: EstadoCola = { visibles: [], cola: [] }

async function traerPedidos(sucursalId: number): Promise<PedidoFila[]> {
  return normalizarPedidos(await obtenerPedidosPorSucursal(sucursalId))
}

// Datos de la lista de una sucursal. La carga inicial muestra todo de una vez;
// las recargas (tiempo real) pasan por `sincronizarCola`, que encola lo nuevo.
// Un contador de solicitudes descarta respuestas viejas (cambio de sucursal o recargas solapadas).
export function usePedidosSucursal(sucursalId: number | null) {
  const [estadoCola, setEstadoCola] = useState<EstadoCola>(VACIO)
  const [cargando, setCargando] = useState(sucursalId !== null)
  const [errorCarga, setErrorCarga] = useState('')
  const solicitudRef = useRef(0)
  // Contador aparte para las recargas: una recarga nunca deja colgada la carga inicial
  const recargaRef = useRef(0)
  const sucursalRef = useRef(sucursalId)

  // Cambio de sucursal: se reinicia el estado en el mismo render (no en un efecto)
  const [sucursalMostrada, setSucursalMostrada] = useState(sucursalId)
  if (sucursalMostrada !== sucursalId) {
    setSucursalMostrada(sucursalId)
    setEstadoCola(VACIO)
    setErrorCarga('')
    setCargando(sucursalId !== null)
  }

  // El efecto solo pide los datos: el estado ya quedó en «cargando» arriba
  useEffect(() => {
    sucursalRef.current = sucursalId
    const solicitud = ++solicitudRef.current
    recargaRef.current += 1 // descarta recargas de la sucursal anterior
    if (sucursalId === null) return

    traerPedidos(sucursalId)
      .then((lista) => {
        if (solicitud !== solicitudRef.current) return
        setEstadoCola(estadoInicialCola(lista))
      })
      .catch((error) => {
        if (solicitud !== solicitudRef.current) return
        setErrorCarga(error instanceof Error ? error.message : 'Error al cargar los pedidos')
      })
      .finally(() => {
        if (solicitud === solicitudRef.current) setCargando(false)
      })
  }, [sucursalId])

  const recargar = useCallback(async () => {
    const objetivo = sucursalRef.current
    if (objetivo === null) return
    const recarga = ++recargaRef.current

    try {
      const lista = await traerPedidos(objetivo)
      if (recarga !== recargaRef.current || sucursalRef.current !== objetivo) return
      setEstadoCola((previo) => sincronizarCola(previo, lista))
      setErrorCarga('')
    } catch (error) {
      if (recarga !== recargaRef.current) return
      setErrorCarga(error instanceof Error ? error.message : 'Error al actualizar los pedidos')
    }
  }, [])

  // Cambio propio (p. ej. la acción rápida): se aplica sin esperar al servidor
  const actualizarLocal = useCallback((pedidoId: number, cambios: Partial<PedidoFila>) => {
    setEstadoCola((previo) => actualizarPedidoEnCola(previo, pedidoId, cambios))
  }, [])

  return { estadoCola, setEstadoCola, cargando, errorCarga, recargar, actualizarLocal }
}
