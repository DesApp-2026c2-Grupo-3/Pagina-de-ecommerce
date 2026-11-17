
import { useCallback, useEffect, useState } from 'react'
import {
  RefreshCw,
  ClipboardList,
  Truck,
  PackageCheck,
  Bike,
  CheckCircle2,
  Clock3,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
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

      await cargarPedidos()
    } finally {
      setTomandoPedidos(false)
    }
  }

  return (
    <div className="space-y-7 pb-24">

      {/* Encabezado */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-600">
              Panel de repartidor
            </p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Pedidos disponibles
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Elegí los pedidos que quieras incluir en tu próximo viaje.
          </p>
        </div>

        <button
          onClick={cargarPedidos}
          disabled={cargando || tomandoPedidos}
          className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={17}
            className={cargando ? 'animate-spin' : 'transition-transform group-hover:rotate-180'}
          />
          Actualizar
        </button>
      </section>

      

{/* Banner principal */}
<section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 p-6 shadow-lg sm:p-8">

  {/* Decoración */}
  <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />
  <div className="absolute -bottom-28 right-1/3 h-56 w-56 rounded-full bg-amber-400/20 blur-3xl" />

  <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
    <div className="max-w-xl">
      <span className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-white/60 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-700">
        <span className="h-2 w-2 rounded-full bg-orange-500" />
        Central de pedidos
      </span>

      <h3 className="mt-5 text-2xl font-extrabold leading-tight text-slate-800 sm:text-3xl">
        ¡Prepará tu próximo recorrido!
      </h3>

      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Revisá los pedidos disponibles, seleccioná los que quieras
        entregar y organizá tu próximo viaje desde acá.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-sm">
          <ClipboardList size={17} className="text-orange-600" />
          <span>
            <strong className="text-slate-800">{pedidos.length}</strong>{' '}
            disponibles
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-orange-200 bg-white/70 px-3 py-2 text-sm text-slate-600 shadow-sm">
          <CheckCircle2 size={17} className="text-emerald-600" />
          <span>
            <strong className="text-slate-800">{seleccionados.length}</strong>{' '}
            seleccionados
          </span>
        </div>
      </div>
    </div>

    <div className="hidden shrink-0 items-center justify-center sm:flex">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-orange-400/30 bg-white/40">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
          <Bike className="text-white" size={39} />
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Contenido */}
      {cargando ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="rounded-2xl bg-orange-100 p-4">
            <ClipboardList className="animate-pulse text-orange-500" size={32} />
          </div>
          <p className="text-sm font-medium text-slate-500">
            Buscando pedidos disponibles...
          </p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
            <AlertTriangle className="text-red-600" size={27} />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900">
            No pudimos cargar los pedidos
          </h3>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <button
            onClick={cargarPedidos}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw size={16} />
            Intentar nuevamente
          </button>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <ClipboardList className="text-slate-400" size={38} />
            </div>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
              <Clock3 size={13} />
              Sin pedidos pendientes
            </span>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">
              No hay pedidos disponibles
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Por ahora no hay pedidos listos para retirar en tu sucursal.
              Cuando aparezcan nuevos pedidos, los vas a encontrar acá.
            </p>

            <button
              onClick={cargarPedidos}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              <RefreshCw size={17} />
              Buscar nuevamente
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Resumen de pedidos */}
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Pedidos para retirar
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Seleccioná uno o varios para armar tu viaje.
              </p>
            </div>

            <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600">
              {pedidos.length}{' '}
              {pedidos.length === 1 ? 'pedido disponible' : 'pedidos disponibles'}
            </span>
          </section>

          {/* Tarjetas */}
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

          {/* Error al tomar pedidos */}
          {errorViaje && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
              <p className="text-sm text-red-600">{errorViaje}</p>
            </div>
          )}
        </>
      )}

      {/* Barra de selección */}
      {seleccionados.length > 0 && !cargando && (
        <div className="sticky bottom-4 z-20">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <PackageCheck className="text-orange-600" size={24} />
              </div>

              <div>
                <p className="font-extrabold text-slate-900">
                  {seleccionados.length}{' '}
                  {seleccionados.length === 1
                    ? 'pedido seleccionado'
                    : 'pedidos seleccionados'}
                </p>
                <p className="text-xs text-slate-500">
                  Se asignarán a tu viaje en preparación.
                </p>
              </div>
            </div>

            <button
              onClick={manejarTomaPedidos}
              disabled={tomandoPedidos}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
            >
              <Truck size={19} />
              {tomandoPedidos
                ? 'Iniciando viaje...'
                : `Tomar pedidos (${seleccionados.length})`}
              {!tomandoPedidos && <ArrowRight size={17} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
