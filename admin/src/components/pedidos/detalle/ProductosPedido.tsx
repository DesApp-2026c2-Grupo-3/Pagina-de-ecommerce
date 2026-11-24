import type { PedidoCompleto } from '../../../types/pedido.types'
import { formatearPrecio } from '../../../utils/pedidos/resumenPedido'
import {
  crearTraductorLineas,
  tuvoPromocion,
} from '../../../utils/pedidos/textosLineaPedido'

type Props = Pick<PedidoCompleto, 'DetallePedidos' | 'catalogo' | 'total' | 'costoEnvio'>

// Líneas del pedido con sus configuraciones y los importes congelados (RN-18)
export default function ProductosPedido({
  DetallePedidos,
  catalogo,
  total,
  costoEnvio,
}: Props) {
  const traductor = crearTraductorLineas(catalogo)
  const envio = Number(costoEnvio ?? 0)
  const hayEnvio = envio > 0

  return (
    <section
      aria-labelledby="titulo-productos"
      className="flex flex-col gap-3 rounded-xl border bg-white p-4"
    >
      <h2 id="titulo-productos" className="font-bold text-gray-900">
        Productos
      </h2>

      <ul className="flex flex-col divide-y divide-gray-100">
        {(DetallePedidos ?? []).map((linea) => {
          const extras = traductor.extras(linea)
          const promo = tuvoPromocion(linea)
          return (
            <li key={linea.id} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">
                  {linea.cantidad}× {traductor.nombreProducto(linea)}
                </p>
                {extras.length > 0 && (
                  <ul className="mt-1 list-disc pl-5 text-sm text-gray-600">
                    {extras.map((texto, i) => (
                      <li key={i}>{texto}</li>
                    ))}
                  </ul>
                )}
                {promo && (
                  <span className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-800">
                    Con promoción
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end">
                {promo && (
                  <span className="text-xs text-gray-500 line-through">
                    <span className="sr-only">Precio de lista: </span>
                    {formatearPrecio(Number(linea.precioLista) * linea.cantidad)}
                  </span>
                )}
                <span className="font-semibold text-gray-900">
                  {formatearPrecio(Number(linea.precio) * linea.cantidad)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <dl className="flex flex-col gap-1 border-t border-gray-100 pt-3 text-sm">
        {hayEnvio && (
          <>
            <div className="flex justify-between text-gray-600">
              <dt>Subtotal</dt>
              <dd>{formatearPrecio(Number(total) - envio)}</dd>
            </div>
            <div className="flex justify-between text-gray-600">
              <dt>Envío</dt>
              <dd>{formatearPrecio(envio)}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between text-base font-bold text-gray-900">
          <dt>Total</dt>
          <dd>{formatearPrecio(total)}</dd>
        </div>
      </dl>
    </section>
  )
}
