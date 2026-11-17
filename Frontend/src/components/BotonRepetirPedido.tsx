import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'
import { getRepetirPedido } from '../services/orderService'
import { getProductoDetalle } from '../services/productService'
import type { ProductoBackend } from '../types/product'
import type { Order } from '../types/order'
import ArmandoPedido from './ArmandoPedido'
import { esperar } from '../utils/esperar'

interface Resumen {
  agregados: number
  noDisponibles: { nombre: string; cantidad: number; motivo: string }[]
  avisos: string[]
  preciosCambiaron: boolean
}

const VARIANTES_BOTON = {
  claro: 'min-h-10 border-2 border-brand-dark bg-brand-cream px-4 text-sm text-brand-dark hover:bg-brand-mustard',
  oscuro: 'min-h-12 bg-brand-dark px-6 text-brand-cream hover:translate-y-0.5',
} as const

const STYLES = {
  buttonBase:
    'inline-flex shrink-0 items-center justify-center rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50 min-[401px]:gap-2',
  errorText: 'mt-2 text-sm font-semibold text-brand-red',
  modalBody: 'flex flex-col gap-4',
  priceNotice: 'rounded-xl bg-brand-cream p-3 text-sm text-brand-dark',
  unavailableList: 'mt-2 flex flex-col gap-2',
  unavailableItem: 'rounded-xl border border-brand-dark/10 p-3 text-sm',
  modalActions: 'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end',
  closeBtn: 'rounded-full border border-brand-dark/20 px-5 py-2 font-bold text-brand-dark hover:border-brand-dark',
  cartBtn: 'rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90',
} as const

interface Props {
  pedido: Order
  variante?: keyof typeof VARIANTES_BOTON
  ocultarMensaje?: boolean
}

function BotonRepetirPedido({ pedido, variante = 'claro', ocultarMensaje = false }: Props) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const { zona, abrirSelector } = useZona()
  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)
  const navigate = useNavigate()

  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState('')

  async function repetir() {
    if (!user) return
    if (!zona) {
      abrirSelector()
      return
    }
    if (sucursalCerrada) {
      setError('La sucursal está cerrada en este horario. No se pueden generar pedidos por ahora.')
      return
    }

    setCargando(true)
    setError('')
    try {
      const [resultado] = await Promise.all([
        getRepetirPedido(pedido.id, user.id, zona.sucursalId),
        esperar(2800),
      ])

      const ids = [...new Set(resultado.disponibles.map((l) => l.productoId))]
      const productos = new Map<number, ProductoBackend>(
        await Promise.all(ids.map(async (id) => [id, await getProductoDetalle(id, zona.sucursalId)] as const))
      )

      const noDisponibles = [...resultado.noDisponibles]
      let agregados = 0
      for (const linea of resultado.disponibles) {
        const producto = productos.get(linea.productoId)
        if (!producto || !producto.disponible) {
          noDisponibles.push({
            nombre: producto?.nombre ?? 'Un producto',
            cantidad: linea.cantidad,
            motivo: 'No hay stock en tu sucursal',
          })
          continue
        }
        addItem(producto, linea.cantidad, linea.selectedOptions, {
          unitPrice: linea.unitPrice,
          personalizaciones: linea.personalizaciones,
          tamanioId: linea.tamanioId,
          combo: linea.combo.length > 0 ? linea.combo : undefined,
        })
        agregados += linea.cantidad
      }

      setResumen({
        agregados,
        noDisponibles,
        avisos: resultado.disponibles.map((l) => l.aviso).filter((a): a is string => Boolean(a)),
        preciosCambiaron: resultado.disponibles.some((l) => l.unitPrice !== l.precioAnterior),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo repetir el pedido')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={repetir}
        disabled={cargando || sucursalCerrada}
        title={sucursalCerrada ? 'La sucursal está cerrada' : 'Repetir pedido'}
        aria-label="Repetir pedido"
        className={`${STYLES.buttonBase} ${VARIANTES_BOTON[variante]}`}
      >
        <RotateCcw size={16} />
        <span className="hidden min-[401px]:inline">
          {cargando ? (
            'Cargando...'
          ) : (
            <>
              <span className="min-[520px]:hidden">Repetir</span>
              <span className="hidden min-[520px]:inline">Repetir pedido</span>
            </>
          )}
        </span>
      </button>

      {error && !ocultarMensaje && <p className={STYLES.errorText}>{error}</p>}
      {cargando && <ArmandoPedido pedido={pedido} />}

      <Modal
        isOpen={resumen !== null}
        onClose={() => setResumen(null)}
        title={
          resumen && resumen.agregados > 0
            ? 'Listo, lo cargamos en tu carrito'
            : 'No pudimos repetir el pedido'
        }
      >
        {resumen && (
          <div className={STYLES.modalBody}>
            {resumen.agregados > 0 && (
              <p className="text-gray-700">
                Agregamos <span className="font-bold">{resumen.agregados}</span>{' '}
                {resumen.agregados === 1 ? 'producto' : 'productos'} a tu carrito.
              </p>
            )}

            {resumen.preciosCambiaron && (
              <p className={STYLES.priceNotice}>
                Los precios se actualizaron a los de hoy, así que el total puede ser distinto al del pedido anterior.
              </p>
            )}

            {resumen.noDisponibles.length > 0 && (
              <div>
                <p className="font-bold text-brand-dark">No pudimos agregar:</p>
                <ul className={STYLES.unavailableList}>
                  {resumen.noDisponibles.map((n, i) => (
                    <li key={i} className={STYLES.unavailableItem}>
                      <span className="font-semibold text-brand-dark">
                        {n.cantidad}x {n.nombre}
                      </span>
                      <span className="block text-gray-600">{n.motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resumen.avisos.length > 0 && (
              <ul className="text-sm text-gray-600">
                {resumen.avisos.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            )}

            <div className={STYLES.modalActions}>
              <button type="button" onClick={() => setResumen(null)} className={STYLES.closeBtn}>
                Cerrar
              </button>
              {resumen.agregados > 0 && (
                <button type="button" onClick={() => navigate('/carrito')} className={STYLES.cartBtn}>
                  Ir al carrito
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default BotonRepetirPedido
