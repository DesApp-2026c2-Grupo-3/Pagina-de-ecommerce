import { Phone } from 'lucide-react'
import type { PedidoCompleto } from '../../../types/pedido.types'

export default function ClientePedido({
  usuario,
}: {
  usuario: PedidoCompleto['Usuario']
}) {
  return (
    <section
      aria-labelledby="titulo-cliente"
      className="flex flex-col gap-2 rounded-xl border bg-white p-4"
    >
      <h2 id="titulo-cliente" className="font-bold text-gray-900">
        Cliente
      </h2>
      {usuario ? (
        <>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="break-all text-gray-600">{usuario.email}</p>
          </div>
          {usuario.telefono && (
            <a
              href={`tel:${usuario.telefono}`}
              className="inline-flex min-h-9 items-center gap-1 self-start text-sm font-semibold text-action hover:underline"
            >
              <Phone size={14} aria-hidden="true" /> {usuario.telefono}
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-gray-500">Cliente no disponible</p>
      )}
    </section>
  )
}
