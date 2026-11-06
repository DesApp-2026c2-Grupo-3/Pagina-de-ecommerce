import { useEffect, useState } from 'react'
import { ReceiptText, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'
import { getHistorialPedidos } from '../../services/orderService'
import BotonRepetirPedido from '../BotonRepetirPedido'
import { formatearFecha } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import type { Order } from '../../types/order'

function resumirProductos(pedido: Order, maximo = 2) {
  const lineas = pedido.DetallePedidos.map((d) => `${d.cantidad}× ${d.Producto.nombre}`)
  const visibles = lineas.slice(0, maximo).join(' + ')
  const resto = lineas.length - maximo
  return resto > 0 ? `${visibles} y ${resto} más` : visibles
}

function UltimoPedidoCard() {
  const { user } = useAuth()
  const { zona } = useZona()
  const [pedido, setPedido] = useState<Order | null>(null)

  const isSucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)

  useEffect(() => {
    if (!user) return

    getHistorialPedidos(user.id)
      .then((pedidos) => {
        if (!pedidos || pedidos.length === 0) {
          setPedido(null)
          return
        }

        const ultimo = pedidos.reduce((masReciente, actual) => {
          return new Date(actual.fecha).getTime() > new Date(masReciente.fecha).getTime()
            ? actual
            : masReciente
        })

        setPedido(ultimo)
      })
      .catch(() => setPedido(null))
  }, [user])

  if (!pedido) return null

  return (
    <section className="relative z-10 -mt-6 sm:-mt-8 md:-mt-12 px-4 pb-6 md:pb-10">
      <div className="mx-auto flex flex-col gap-2 md:gap-3 rounded-[1.75rem] border-2 border-brand-dark bg-white p-3 md:p-6 shadow-sticker max-w-7xl">
        
        {/* Fila Principal */}
        <div className="flex flex-row items-center justify-between gap-2 md:gap-6 w-full">
          
          {/* Lado Izquierdo: Ícono + Textos */}
          <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
            <span className="hidden md:grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-cream">
              <ReceiptText className="h-7 w-7 text-brand-red" />
            </span>

            <div className="min-w-0 flex-1">
              {/* 
                Quitamos el 'truncate' y dejamos que el texto fluya libremente 
                hacia abajo si el espacio horizontal no alcanza en 360px.
              */}
              <p className="block md:hidden text-[10px] font-bold uppercase tracking-wider text-brand-muted leading-normal">
                Tu último pedido · {formatearFecha(pedido.fecha)}
              </p>

              <p className="hidden md:block text-xs font-bold uppercase tracking-wider text-brand-muted">
                Tu último pedido
              </p>
              <p className="hidden md:block text-xs font-bold uppercase tracking-wider text-brand-muted">
                {formatearFecha(pedido.fecha)}
              </p>
              
              <p className="mt-0.5 md:mt-0 font-display text-xs sm:text-xs sm:max-[860px]:text-sm md:text-2xl font-extrabold leading-tight text-brand-dark truncate md:whitespace-normal">
                {resumirProductos(pedido)}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Precio + Botón */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 md:gap-6 shrink-0">
            {/* Precio */}
            <span className="font-display text-base sm:text-lg md:text-3xl font-extrabold text-brand-dark whitespace-nowrap">
              {formatearPrecio(Number(pedido.total))}
            </span>

            {/* Botón */}
            <div className="text-xs md:text-base max-w-[125px] sm:max-w-[155px] md:max-w-none [&_button]:!font-bold [&_button]:whitespace-nowrap [&_button]:min-h-0 md:[&_button]:min-h-12 [&_button]:py-2 md:[&_button]:py-3 [&_button]:px-3 md:[&_button]:px-6">
              <BotonRepetirPedido 
                pedido={pedido} 
                variante="oscuro" 
                ocultarMensaje={true} 
              />
            </div>
          </div>

        </div>

        {/* Mensaje controlado abajo */}
        {isSucursalCerrada && (
          <div className="w-full flex items-center justify-center gap-1.5 border-t border-brand-dark/5 pt-2 mt-1">
            <Store className="h-3.5 w-3.5 md:h-4 md:w-4 text-brand-red shrink-0" />
            <p className="text-[10px] sm:text-xs font-bold text-brand-red uppercase tracking-wider font-display">
              Sucursal cerrada. No tomamos pedidos ahora.
            </p>
          </div>
        )}

      </div>
    </section>
  )
}

export default UltimoPedidoCard
