
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, Truck, ClipboardList } from 'lucide-react'

import { obtenerViajeActivo } from '../../services/viajeService'
import type { ViajeActivo } from '../../types/viaje.types'
import TarjetaPedidoViaje from '../../components/viaje/TarjetaPedidoViaje'
import { actualizarEstadoPedido } from '../../services/pedidoService'

export default function Viaje() {
  const [viaje, setViaje] = useState<ViajeActivo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [pedidoProcesando, setPedidoProcesando] = useState<number | null>(null)
  const [errorAccion, setErrorAccion] = useState('')

  const cargarViaje = useCallback(async () => {
    try {
      setCargando(true)
      setError('')

      const datos = await obtenerViajeActivo()
      setViaje(datos)
    } catch {
      setError('No se pudo obtener la información del viaje.')
    } finally {
      setCargando(false)
    }
  }, [])

  const cambiarEstadoPedido = async ( pedidoId: number, estado: 'En camino' | 'Entregado') => {
    try {
      setPedidoProcesando(pedidoId)
      setErrorAccion('')

      await actualizarEstadoPedido(pedidoId, estado)

      const datos = await obtenerViajeActivo()
      setViaje(datos)

    } catch (error) {
      setErrorAccion(
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar el estado del pedido.'
      )
    } finally {
      setPedidoProcesando(null)
    }
  }

  useEffect(() => {
    cargarViaje()
  }, [cargarViaje])

  if (cargando) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        Cargando viaje...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={cargarViaje}
          className="mt-3 text-sm font-semibold text-red-700 underline"
        >
          Intentar nuevamente
        </button>
      </div>
    )
  }

  if (!viaje) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <ClipboardList className="mx-auto text-slate-300" size={42} />
        <h2 className="mt-4 font-bold text-slate-800">
          No tenés un viaje activo
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Cuando inicies un viaje, sus pedidos aparecerán acá.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Mi viaje
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Seguimiento de tus pedidos asignados.
          </p>
        </div>

        <button
          onClick={cargarViaje}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </section>

      <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-orange-100 p-3">
            <Truck className="text-orange-600" size={24} />
          </div>

          <div>
            <p className="text-sm font-medium text-orange-700">
              Viaje activo
            </p>
            <h3 className="text-xl font-bold text-slate-900">
              Viaje #{viaje.id}
            </h3>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 text-sm text-slate-600">
          <p>
            Inicio:{' '}
            <strong>
              {new Date(viaje.fechaInicio).toLocaleString('es-AR')}
            </strong>
          </p>
          <p>
            Pedidos: <strong>{viaje.Pedidos.length}</strong>
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Pedidos del viaje
        </h3>
        
        {errorAccion && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-600">{errorAccion}</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {viaje.Pedidos.map((pedido) => (
            <TarjetaPedidoViaje key={pedido.id} pedido={pedido}
              onActualizarEstado={cambiarEstadoPedido}
              procesando={pedidoProcesando === pedido.id}
            />
            ))
          }
        </div>
      </section>
    </div>
  )
}
