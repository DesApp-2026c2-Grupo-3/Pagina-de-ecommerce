
import { useState, useEffect, useRef } from 'react'
import {
  MapPin,
  UserRound,
  Package,
  Clock,
  Phone,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'

import type { Pedido } from '../../types/pedido.types'

interface TarjetaPedidoViajeProps {
  pedido: Pedido
  onActualizarEstado: (
    pedidoId: number,
    estado: 'En camino' | 'Entregado'
  ) => void
  procesando: boolean
  puedeRetirar: boolean
  puedeEntregar: boolean
  puedeQuitar?: boolean
  onQuitarPedido?: (pedidoId: number) => void
}

export default function TarjetaPedidoViaje({
  pedido,
  onActualizarEstado,
  procesando,
  puedeRetirar,
  puedeEntregar,
  puedeQuitar,
  onQuitarPedido,
}: TarjetaPedidoViajeProps) {
  const fecha = new Date(pedido.fecha)
  const direccion = pedido.Direccion
  const telefono = pedido.Usuario.telefono

  const [mostrarProductos, setMostrarProductos] = useState(false)

  const tieneCoordenadas =
    direccion?.latitud != null && direccion?.longitud != null

  const urlMaps = tieneCoordenadas
    ? `https://www.google.com/maps/search/?api=1&query=${direccion.latitud},${direccion.longitud}`
    : null

  const productosRef = useRef<HTMLDivElement>(null)

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
    <article className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">

      {/* Encabezado del pedido */}
      <div className="grid grid-cols-2 items-center gap-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Pedido #{pedido.id}
        </p>

        <div className="flex justify-end">
          <span className="rounded-full border border-orange-200 bg-orange-50 px-4 py-1 text-xs font-bold text-orange-700">
            {pedido.estado}
          </span>
        </div>

        <h3 className="text-xl font-extrabold text-slate-800">
          ${Number(pedido.total).toLocaleString('es-AR')}
        </h3>

        {/* Desplegable de productos */}
        <div ref={productosRef} className="relative flex justify-end">
          <button
            type="button"
            onClick={() => setMostrarProductos(!mostrarProductos)}
            className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 p-2 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
          >
            <Package size={16} />
            {pedido.DetallePedidos.length} productos
            <ChevronDown
              size={15}
              className={`transition-transform ${
                mostrarProductos ? 'rotate-180' : ''
              }`}
            />
          </button>

          {mostrarProductos && (
            <div className="absolute right-0 top-full z-30 mt-2 w-80 max-w-[calc(100vw-3rem)] rounded-xl border border-orange-200 bg-white p-3 shadow-xl">
              <h4 className="mb-3 text-sm font-bold text-slate-800">
                Productos del pedido
              </h4>

              <div className="max-h-64 space-y-3 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-50 scrollbar-thumb-rounded-full">
                {pedido.DetallePedidos.map((detalle) => (
                  <div key={detalle.id} className="flex items-center gap-3">
                    {detalle.Producto.imagen ? (
                      <img
                        src={detalle.Producto.imagen}
                        alt={detalle.Producto.nombre}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                        <Package className="text-orange-400" size={18} />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {detalle.Producto.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        Cantidad: {detalle.cantidad}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-bold text-slate-700">
                      ${Number(detalle.precio).toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Datos del cliente y dirección */}
      <div className="mt-5 space-y-4 border-t border-orange-100 pt-4">

        {/* Cliente */}
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <UserRound size={18} className="text-orange-600" />
          </div>

          <div className="pt-1">
            <p className="font-bold text-slate-800">
              {pedido.Usuario.nombre} {pedido.Usuario.apellido ?? ''}
            </p>

            {telefono && (
              <a
                href={`tel:${telefono}`}
                className="mt-1 inline-flex items-center gap-2 font-medium text-orange-600 transition hover:text-orange-700"
              >
                <Phone size={14} />
                {telefono}
              </a>
            )}
          </div>
        </div>

        {/* Dirección */}
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <MapPin size={18} className="text-orange-600" />
          </div>

          <div className="min-w-0 flex-1 pt-1">
            {direccion ? (
              <>
                <p className="font-bold text-slate-800">
                  {direccion.calle} {direccion.numero}
                  {direccion.piso ? `, ${direccion.piso}` : ''}
                </p>

                <p className="mt-1 text-slate-500">
                  {direccion.localidad}
                  {direccion.provincia ? `, ${direccion.provincia}` : ''}
                </p>

                {direccion.alias && (
                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {direccion.alias}
                  </p>
                )}

                {direccion.observaciones && (
                  <p className="mt-2 rounded-lg border border-orange-100 bg-orange-50/70 p-3 text-xs text-slate-600">
                    <span className="font-bold text-orange-700">
                      Indicaciones:
                    </span>{' '}
                    {direccion.observaciones}
                  </p>
                )}

                {urlMaps && (
                  <a
                    href={urlMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 font-bold text-orange-600 transition hover:text-orange-700"
                  >
                    <ExternalLink size={15} />
                    Abrir en Google Maps
                  </a>
                )}
              </>
            ) : (
              <p className="pt-1 text-slate-400">
                Dirección no disponible
              </p>
            )}
          </div>
        </div>

        {/* Fecha */}
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50">
            <Clock size={18} className="text-orange-600" />
          </div>

          <span>
            {fecha.toLocaleDateString('es-AR')} ·{' '}
            {fecha.toLocaleTimeString('es-AR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Observaciones del pedido */}
      {pedido.observaciones && (
        <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50/70 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-700">
            Observaciones del pedido
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {pedido.observaciones}
          </p>
        </div>
      )}

      {/* Acciones del repartidor */}
      {pedido.estado === 'Listo para retirar' && (
        <button
          onClick={() => onActualizarEstado(pedido.id, 'En camino')}
          disabled={procesando || !puedeRetirar}
          className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/20 transition-all hover:bg-orange-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {procesando ? 'Procesando...' : 'Retirar pedido'}
        </button>
      )}

      {pedido.estado === 'Listo para retirar' && puedeQuitar && (
        <button
          onClick={() => onQuitarPedido?.(pedido.id)}
          className="mt-3 w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:border-red-300 hover:bg-red-50"
        >
          Quitar del viaje
        </button>
      )}

      {pedido.estado === 'En camino' && (
        <button
          onClick={() => onActualizarEstado(pedido.id, 'Entregado')}
          disabled={procesando || !puedeEntregar}
          className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          {procesando ? 'Procesando...' : 'Confirmar entrega'}
        </button>
      )}
    </article>
  )
}
