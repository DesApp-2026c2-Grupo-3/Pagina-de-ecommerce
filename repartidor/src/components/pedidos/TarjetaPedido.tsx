
import type { Pedido } from '../../types/pedido.types'
import { MapPin, Clock, UserRound, Package, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface TarjetaPedidoProps {
  pedido: Pedido
  seleccionado: boolean
  onSeleccionar: (id: number) => void
}

export default function TarjetaPedido({ pedido, seleccionado, onSeleccionar }: TarjetaPedidoProps) {
  const fecha = new Date(pedido.fecha)

  const [mostrarProductos, setMostrarProductos] = useState(false)

  const botonProductosRef = useRef<HTMLButtonElement>(null)
  const productosRef = useRef<HTMLDivElement>(null)
  const [abrirArriba, setAbrirArriba] = useState(false)

  useEffect(() => {
    if (!mostrarProductos || !botonProductosRef.current) return

    const rect = botonProductosRef.current.getBoundingClientRect()
    const espacioAbajo = window.innerHeight - rect.bottom

    setAbrirArriba(espacioAbajo < 280)
  }, [mostrarProductos])

  useEffect(() => {
    const manejarClickFuera = (event: MouseEvent) => {
      if (
        productosRef.current &&
        !productosRef.current.contains(event.target as Node)
      ) {
        setMostrarProductos(false)
      }
    }

    document.addEventListener('mousedown', manejarClickFuera)

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera)
    }
  }, [])

  return (
    <article className={`rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
      seleccionado
        ? 'border-orange-400 ring-2 ring-orange-200'
        : 'border-orange-100 hover:border-orange-200'
    }`}>

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Pedido #{pedido.id}
          </p>
          <h3 className="mt-1 text-xl font-extrabold text-slate-800">
            ${Number(pedido.total).toLocaleString('es-AR')}
          </h3>
        </div>

        <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
          Pendiente
        </span>
      </div>

      {/* Información */}
      <div className="mt-4 space-y-3 border-t border-orange-100 pt-4">

        {/* Cliente y productos */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <UserRound size={16} className="shrink-0 text-orange-500" />
            <span className="truncate">
              {pedido.Usuario.nombre} {pedido.Usuario.apellido}
            </span>
          </div>

          <div ref={productosRef} className="relative">
            <button
              ref={botonProductosRef}
              type="button"
              onClick={() => setMostrarProductos(!mostrarProductos)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs font-semibold text-orange-700 transition hover:bg-orange-100"
            >
              <Package size={15} />
              {pedido.DetallePedidos.length} productos
              <ChevronDown
                size={14}
                className={`transition-transform ${
                  mostrarProductos ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mostrarProductos && (
              <div className={`absolute right-0 z-30 w-64 rounded-xl border border-orange-200 bg-white p-3 shadow-xl ${
                abrirArriba ? 'bottom-full mb-2' : 'top-full mt-2'
              }`}>
                <p className="mb-2 text-xs font-bold text-slate-700">
                  Productos del pedido
                </p>

                <div className="max-h-48 space-y-2 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-orange-500 scrollbar-track-orange-50 scrollbar-thumb-rounded-full">
                  {pedido.DetallePedidos.map((detalle) => (
                    <div key={detalle.id} className="flex items-center justify-between gap-3 rounded-lg p-1.5 transition hover:bg-orange-50">
                      <span className="shrink-0">
                        {detalle.Producto.imagen ? (
                          <img
                            src={detalle.Producto.imagen}
                            alt={detalle.Producto.nombre}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50">
                            <Package className="text-orange-400" size={20} />
                          </div>
                        )}
                      </span>

                      <span className="min-w-0 flex-1 text-sm text-slate-700">
                        {detalle.Producto.nombre}
                      </span>

                      <span className="shrink-0 text-sm font-bold text-orange-700">
                        x{detalle.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="flex items-start gap-2 text-sm text-slate-600">
          <MapPin size={16} className="mt-0.5 shrink-0 text-orange-500" />
          <span className="line-clamp-2">
            {pedido.Direccion
              ? `${pedido.Direccion.calle} ${pedido.Direccion.numero}, ${pedido.Direccion.localidad}`
              : 'Dirección no disponible'}
          </span>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={15} className="shrink-0 text-orange-500" />
          <span>
            {fecha.toLocaleDateString('es-AR')} ·{' '}
            {fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Selección */}
      <button
        type="button"
        onClick={() => onSeleccionar(pedido.id)}
        className={`mt-5 w-full rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${
          seleccionado
            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 hover:bg-orange-700'
            : 'border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-300 hover:bg-orange-100'
        }`}
      >
        {seleccionado ? 'Quitar de la seleccion' : 'Seleccionar pedido'}
      </button>
    </article>
  )
}
