import { MapPin } from 'lucide-react'
import type { PedidoCompleto } from '../../../types/pedido.types'

export default function EntregaPedido({
  direccion,
}: {
  direccion: PedidoCompleto['Direccion']
}) {
  const d = direccion
  const linkMapa =
    d?.latitud != null && d?.longitud != null
      ? `https://www.google.com/maps?q=${d.latitud},${d.longitud}`
      : null

  return (
    <section
      aria-labelledby="titulo-entrega"
      className="flex flex-col gap-2 rounded-xl border bg-white p-4"
    >
      <h2 id="titulo-entrega" className="font-bold text-gray-900">
        Entrega
      </h2>
      {d ? (
        <>
          <div className="text-sm">
            <p className="text-gray-900">
              {d.calle} {d.numero}
              {d.piso && `, ${d.piso}`}
            </p>
            <p className="text-gray-600">
              {[d.localidad, d.provincia].filter(Boolean).join(', ')}
            </p>
          </div>
          {d.observaciones && (
            <p className="rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Indicaciones: {d.observaciones}
            </p>
          )}
          {linkMapa && (
            <a
              href={linkMapa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1 self-start text-sm font-semibold text-action hover:underline"
            >
              <MapPin size={14} aria-hidden="true" /> Ver en el mapa
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">Sin dirección</p>
      )}
    </section>
  )
}
