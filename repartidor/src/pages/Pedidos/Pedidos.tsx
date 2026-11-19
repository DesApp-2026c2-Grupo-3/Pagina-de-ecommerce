
import { useState } from 'react'
import {
  RefreshCw,
  ClipboardList,
  Truck,
  PackageCheck,
  Bike,
  CheckCircle2,
  Clock3,
  AlertTriangle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import TarjetaPedido from '../../components/pedidos/TarjetaPedido'
import Boton from '../../components/ui/Boton'
import BarraAccionFija from '../../components/ui/BarraAccionFija'
import { usePedidosDisponibles } from '../../hooks/usePedidosDisponibles'
import { useAhora } from '../../hooks/useAhora'
import { useAvisoAccion } from '../../hooks/useAvisoAccion'

export default function Pedidos() {
  const navigate = useNavigate()

  const { pedidos, cargando, error, recargar: cargarPedidos, tomar } = usePedidosDisponibles()
  const ahora = useAhora()
  const aviso = useAvisoAccion()

  const [seleccion, setSeleccion] = useState<number[]>([])
  const [tomandoPedidos, setTomandoPedidos] = useState(false)

  // Si otro repartidor tomó un pedido seleccionado, deja de contar (la lista se refresca sola)
  const seleccionados = seleccion.filter((id) => pedidos.some((pedido) => pedido.id === id))

  const alternarSeleccion = (id: number) => {
    setSeleccion((actuales) =>
      actuales.includes(id)
        ? actuales.filter((pedidoId) => pedidoId !== id)
        : [...actuales, id],
    )
  }

  // Si sale bien, ir a Mi viaje ya lo confirma. El error se avisa con un toast: la barra
  // está abajo y un mensaje en la página podía quedar fuera de la vista.
  const manejarTomaPedidos = async () => {
    if (seleccionados.length === 0) return

    try {
      setTomandoPedidos(true)
      await tomar(seleccionados)

      setSeleccion([])
      navigate('/viaje')
    } catch (error) {
      aviso.error('No se pudieron tomar los pedidos', error)
    } finally {
      setTomandoPedidos(false)
    }
  }

  return (
    <div className="space-y-7 md:pb-24">

      {/* Encabezado */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <p className="text-xs font-bold uppercase tracking-widest text-orange-700">
              Panel de repartidor
            </p>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Pedidos disponibles
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Elegí los pedidos que quieras incluir en tu próximo viaje.
          </p>
        </div>

        <Boton
          variante="secundaria"
          icono={RefreshCw}
          onClick={cargarPedidos}
          disabled={tomandoPedidos}
          cargando={cargando}
          textoCargando="Actualizando…"
        >
          Actualizar
        </Boton>
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
          <p className="text-sm font-medium text-slate-600">
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

          <div className="mt-5 flex justify-center">
            <Boton icono={RefreshCw} onClick={cargarPedidos}>
              Intentar nuevamente
            </Boton>
          </div>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="relative overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-100/50 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100">
              <ClipboardList className="text-slate-400" size={38} />
            </div>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Clock3 size={13} />
              Sin pedidos pendientes
            </span>

            <h3 className="mt-4 text-xl font-extrabold text-slate-900">
              No hay pedidos disponibles
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Por ahora no hay pedidos listos para retirar en tu sucursal.
              Cuando aparezcan nuevos pedidos, los vas a encontrar acá.
            </p>

            <div className="mt-6 flex justify-center">
              <Boton icono={RefreshCw} onClick={cargarPedidos}>
                Buscar nuevamente
              </Boton>
            </div>
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
              <p className="mt-1 text-sm text-slate-600">
                Seleccioná uno o varios para armar tu viaje.
              </p>
            </div>

            <span className="rounded-xl bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700">
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
                ahora={ahora}
              />
            ))}
          </div>
        </>
      )}

      {/* Barra de selección: pegada abajo en el celular (encima de la navegación) y
          flotante como siempre en escritorio */}
      {seleccionados.length > 0 && !cargando && (
        <BarraAccionFija enEscritorio="flotante">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                <PackageCheck className="text-orange-700" size={24} />
              </div>

              <div>
                <p className="font-extrabold text-slate-900">
                  {seleccionados.length}{' '}
                  {seleccionados.length === 1
                    ? 'pedido seleccionado'
                    : 'pedidos seleccionados'}
                </p>
                <p className="text-xs text-slate-600">
                  Se asignarán a tu viaje en preparación.
                </p>
              </div>
            </div>

            <div className="sm:w-auto">
              <Boton
                tamano="lg"
                anchoCompleto
                icono={Truck}
                onClick={manejarTomaPedidos}
                cargando={tomandoPedidos}
                textoCargando="Tomando pedidos…"
              >
                {`Tomar pedidos (${seleccionados.length})`}
              </Boton>
            </div>
          </div>
        </BarraAccionFija>
      )}
    </div>
  )
}
