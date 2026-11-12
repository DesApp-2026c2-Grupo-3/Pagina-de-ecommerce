
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ClipboardList, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import TarjetaPedido from '../../components/pedidos/TarjetaPedido'
import { obtenerPedidosDisponibles } from '../../services/pedidoService'
import { tomarPedidos } from '../../services/viajeService'
import type { Pedido } from '../../types/pedido.types'

export default function Pedidos() {
  const navigate = useNavigate()

  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [cargando, setCargando] = useState(true)
  const [tomandoPedidos, setTomandoPedidos] = useState(false)
  const [error, setError] = useState('')
  const [errorViaje, setErrorViaje] = useState('')

  const cargarPedidos = useCallback(async () => {
    try {
      setError('')
      setCargando(true)

      const datos = await obtenerPedidosDisponibles()
      setPedidos(datos)

      // Quitar de la selección los pedidos que ya no estén disponibles.
      setSeleccionados((actuales) =>
        actuales.filter((id) => datos.some((pedido) => pedido.id === id)),
      )
    } catch {
      setError('No se pudieron cargar los pedidos disponibles.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarPedidos()
  }, [cargarPedidos])

  const alternarSeleccion = (id: number) => {
    setSeleccionados((actuales) =>
      actuales.includes(id)
        ? actuales.filter((pedidoId) => pedidoId !== id)
        : [...actuales, id],
    )

    setErrorViaje('')
  }

  const manejarTomaPedidos = async () => {
    if (seleccionados.length === 0) return

    try {
      setErrorViaje('')
      setTomandoPedidos(true)

      await tomarPedidos(seleccionados)

      setSeleccionados([])
      navigate('/viaje')
    } catch (error) {
      setErrorViaje(
        error instanceof Error
          ? error.message
          : 'No se pudieron tomar los pedidos.',
      )

      // Actualizar los pedidos por si alguno dejó de estar disponible.
      await cargarPedidos()
    } finally {
      setTomandoPedidos(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Pedidos disponibles
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Seleccioná los pedidos que quieras incluir en tu próximo viaje.
          </p>
        </div>

        <button
          onClick={cargarPedidos}
          disabled={cargando || tomandoPedidos}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold 
          text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} className={cargando ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </section>

      {cargando ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Cargando pedidos...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={cargarPedidos}
            className="mt-3 text-sm font-semibold text-red-700 underline"
          >
            Intentar nuevamente
          </button>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <ClipboardList className="mx-auto text-slate-300" size={42} />
          <h3 className="mt-4 font-semibold text-slate-800">
            No hay pedidos disponibles
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Cuando haya nuevos pedidos pendientes, aparecerán acá.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-500">
            {pedidos.length}{' '}
            {pedidos.length === 1
              ? 'pedido disponible'
              : 'pedidos disponibles'}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pedidos.map((pedido) => (
              <TarjetaPedido
                key={pedido.id}
                pedido={pedido}
                seleccionado={seleccionados.includes(pedido.id)}
                onSeleccionar={alternarSeleccion}
              />
            ))}
          </div>

          {errorViaje && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorViaje}
            </div>
          )}

          {seleccionados.length > 0 && (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-white p-4 shadow-lg">
              <div>
                <p className="font-bold text-slate-900">
                  {seleccionados.length}{' '}
                  {seleccionados.length === 1
                    ? 'pedido seleccionado'
                    : 'pedidos seleccionados'}
                </p>
                <p className="text-sm text-slate-500">
                  Se asignarán a tu viaje en preparación.
                </p>
              </div>

              <button
                onClick={manejarTomaPedidos}
                disabled={tomandoPedidos}
                className="flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold
                 text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Truck size={19} />
                {tomandoPedidos
                  ? 'Iniciando viaje...'
                  : `Iniciar viaje (${seleccionados.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
