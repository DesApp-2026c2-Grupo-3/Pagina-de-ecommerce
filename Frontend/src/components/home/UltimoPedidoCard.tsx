import { useEffect, useState } from 'react'
import { ReceiptText, Store } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useZona } from '../../context/ZonaContext'
import { getHistorialPedidos } from '../../services/orderService'
import BotonRepetirPedido from '../BotonRepetirPedido'
import { formatearFecha } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import type { Order } from '../../types/order'

const RESPONSIVE_STYLES = `
  .ultimo-pedido-icono { display: none; }
  
  @media (min-width: 360px) {
    .ultimo-pedido-icono { display: grid; }
    .ultimo-pedido-fecha { font-size: 0.75rem; line-height: 1rem; }
    .ultimo-pedido-productos { font-size: 0.875rem; line-height: 1.25rem; }
    .ultimo-pedido-precio { font-size: 1.125rem; line-height: 1.75rem; }
    .ultimo-pedido-boton { font-size: 0.875rem; line-height: 1.25rem; max-width: none; }
  }
  @media (min-width: 768px) {
    .ultimo-pedido-productos { font-size: 1.5rem; line-height: 2rem; }
    .ultimo-pedido-precio { font-size: 1.875rem; line-height: 2.25rem; }
    .ultimo-pedido-boton { font-size: 1rem; line-height: 1.5rem; }
  }
`

const STYLES = {
  section: 'relative z-10 -mt-6 px-4 pb-6 sm:-mt-8 md:-mt-12 md:pb-10',
  card: 'mx-auto flex max-w-7xl flex-col gap-2 rounded-[1.75rem] border-2 border-brand-dark bg-white p-3 shadow-sticker sm:p-4 md:gap-3 md:p-6',
  mainRow: 'flex w-full flex-row items-center justify-between gap-2 sm:gap-4 md:gap-6',
  leftSide: 'flex min-w-0 flex-1 items-center gap-2 md:gap-4',
  iconBadge: 'ultimo-pedido-icono h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-cream md:h-14 md:w-14 md:rounded-2xl',
  icon: 'h-4.5 w-4.5 text-brand-red md:h-7 md:w-7',
  mobileDate: 'ultimo-pedido-fecha block text-[10px] font-bold uppercase leading-normal tracking-wider text-brand-muted sm:text-xs md:hidden',
  desktopMeta: 'hidden text-xs font-bold uppercase tracking-wider text-brand-muted md:block',
  productsText: 'ultimo-pedido-productos mt-0.5 truncate font-display text-xs font-extrabold leading-tight text-brand-dark sm:text-sm md:mt-0 md:whitespace-normal md:text-2xl',
  rightSide: 'flex shrink-0 flex-row items-center gap-2 sm:gap-4 md:gap-6',
  priceText: 'ultimo-pedido-precio whitespace-nowrap font-display text-base font-extrabold text-brand-dark sm:text-lg md:text-3xl',
  buttonWrapper:
    'ultimo-pedido-boton max-w-[125px] text-xs sm:max-w-none sm:text-sm md:text-base [&_button]:min-h-0 [&_button]:whitespace-nowrap [&_button]:px-3 [&_button]:py-2 [&_button]:!font-bold md:[&_button]:min-h-12 md:[&_button]:px-6 md:[&_button]:py-3',
  closedBanner: 'mt-1 flex w-full items-center justify-center gap-1.5 border-t border-brand-dark/5 pt-2',
  closedIcon: 'h-3.5 w-3.5 shrink-0 text-brand-red md:h-4 md:w-4',
  closedText: 'font-display text-[10px] font-bold uppercase tracking-wider text-brand-red sm:text-xs',
} as const

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

        const ultimo = pedidos.reduce((masReciente, actual) =>
          new Date(actual.fecha).getTime() > new Date(masReciente.fecha).getTime() ? actual : masReciente
        )

        setPedido(ultimo)
      })
      .catch(() => setPedido(null))
  }, [user])

  if (!pedido) return null

  return (
    <section className={STYLES.section}>
      <style>{RESPONSIVE_STYLES}</style>

      <div className={STYLES.card}>
        <div className={STYLES.mainRow}>
          <div className={STYLES.leftSide}>
            <span className={STYLES.iconBadge}>
              <ReceiptText className={STYLES.icon} />
            </span>

            <div className="min-w-0 flex-1">
              <p className={STYLES.mobileDate}>
                Tu último pedido · {formatearFecha(pedido.fecha)}
              </p>
              <p className={STYLES.desktopMeta}>Tu último pedido</p>
              <p className={STYLES.desktopMeta}>{formatearFecha(pedido.fecha)}</p>

              <p className={STYLES.productsText}>{resumirProductos(pedido)}</p>
            </div>
          </div>

          <div className={STYLES.rightSide}>
            <span className={STYLES.priceText}>{formatearPrecio(Number(pedido.total))}</span>

            <div className={STYLES.buttonWrapper}>
              <BotonRepetirPedido pedido={pedido} variante="oscuro" ocultarMensaje />
            </div>
          </div>
        </div>

        {isSucursalCerrada && (
          <div className={STYLES.closedBanner}>
            <Store className={STYLES.closedIcon} />
            <p className={STYLES.closedText}>Sucursal cerrada. No tomamos pedidos ahora.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default UltimoPedidoCard
