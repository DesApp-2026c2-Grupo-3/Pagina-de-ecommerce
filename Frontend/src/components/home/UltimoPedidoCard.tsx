import { ReceiptText, Store } from 'lucide-react'
import { useZona } from '../../context/ZonaContext'
import { useUltimoPedido } from '../../hooks/useUltimoPedido'
import BotonRepetirPedido from '../BotonRepetirPedido'
import { formatearFecha } from '../../utils/fechas'
import { formatearPrecio } from '../../utils/precio'
import type { Order } from '../../types/order'

const STYLES = {
  section: 'relative z-10 -mt-6 px-4 pb-6 sm:-mt-8 md:-mt-12 md:pb-10',
  card: 'relative mx-auto flex max-w-7xl flex-col gap-2 rounded-[1.75rem] border-2 border-brand-dark bg-white px-3 pb-3 pt-3.5 shadow-sticker min-[430px]:p-3 sm:p-4 md:gap-3 md:p-6',
  floatingBadge:
    'absolute -top-3.5 left-1/2 -translate-x-1/2 z-20 inline-flex items-center whitespace-nowrap rounded-full border-2 border-black bg-brand-red px-2.5 py-0.5 font-display text-[10px] font-extrabold uppercase tracking-wider text-white min-[430px]:hidden',
  mainRow: 'flex w-full flex-row items-center justify-between gap-2 sm:gap-4 md:gap-6',
  leftSide: 'flex min-w-0 flex-1 items-center gap-2 md:gap-4',
  iconBadge:
    'hidden min-[360px]:grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-cream md:h-14 md:w-14 md:rounded-2xl',
  icon: 'h-4.5 w-4.5 text-brand-red md:h-7 md:w-7',
  mobileDate:
    'block whitespace-nowrap text-[10px] min-[360px]:text-xs font-bold uppercase leading-normal tracking-wider text-brand-muted md:hidden',
  desktopMeta: 'hidden text-xs font-bold uppercase tracking-wider text-brand-muted md:block',
  productsText:
    'mt-0.5 truncate font-display text-xs min-[360px]:text-sm font-extrabold leading-tight text-brand-dark md:mt-0 md:text-2xl',
  rightSide: 'flex shrink-0 flex-row items-center gap-2 sm:gap-4 md:gap-6',
  priceText:
    'whitespace-nowrap font-display text-base min-[360px]:text-lg font-extrabold text-brand-dark md:text-3xl',
  buttonWrapper:
    "shrink-0 text-xs min-[360px]:text-sm md:text-base [&_button]:min-h-0 [&_button]:gap-0 [&_button]:whitespace-nowrap [&_button]:p-2.5 [&_button]:text-[0px] [&_button]:!font-bold min-[500px]:[&_button]:gap-2 min-[500px]:[&_button]:px-3 min-[500px]:[&_button]:py-2 min-[500px]:[&_button]:after:text-sm min-[500px]:[&_button]:after:content-['Repetir'] min-[540px]:[&_button]:text-sm min-[540px]:[&_button]:after:hidden md:[&_button]:min-h-12 md:[&_button]:px-6 md:[&_button]:py-3 md:[&_button]:text-base",
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
  const { zona, sucursalDesactivada } = useZona()
  const pedido = useUltimoPedido()

  const isSucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)

  if (!pedido) return null

  const resumen = resumirProductos(pedido)
  const fechaFormateada = formatearFecha(pedido.fecha)

  return (
    <section className={STYLES.section}>
      <div className={STYLES.card}>
        <span className={STYLES.floatingBadge}>Tu último pedido</span>

        <div className={STYLES.mainRow}>
          <div className={STYLES.leftSide}>
            <span className={STYLES.iconBadge}>
              <ReceiptText className={STYLES.icon} />
            </span>

            <div className="min-w-0 flex-1">
              <p className={STYLES.mobileDate}>
                <span className="min-[430px]:hidden">Fecha: {fechaFormateada}</span>
                <span className="hidden min-[430px]:inline">Tu último pedido · {fechaFormateada}</span>
              </p>
              <p className={STYLES.desktopMeta}>Tu último pedido</p>
              <p className={STYLES.desktopMeta}>{fechaFormateada}</p>

              <p className={STYLES.productsText} title={resumen}>
                {resumen}
              </p>
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
            <p className={STYLES.closedText}>
              {sucursalDesactivada ? 'Sucursal desactivada. Elegí otra dirección.' : 'Sucursal cerrada. No tomamos pedidos ahora.'}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default UltimoPedidoCard
