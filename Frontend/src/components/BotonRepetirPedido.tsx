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

interface Resumen {
  agregados: number
  noDisponibles: { nombre: string; cantidad: number; motivo: string }[]
  avisos: string[]
  preciosCambiaron: boolean
}

function BotonRepetirPedido({ pedidoId }: { pedidoId: number }) {
  const { user } = useAuth()
  const { addItem } = useCart()
  const { zona, abrirSelector } = useZona()
  const navigate = useNavigate()

  const [cargando, setCargando] = useState(false)
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [error, setError] = useState('')

  async function repetir() {
    if (!user) return
    // Sin zona no se sabe de qué sucursal es el stock: primero hay que elegirla
    if (!zona) {
      abrirSelector()
      return
    }

    setCargando(true)
    setError('')
    try {
      const resultado = await getRepetirPedido(pedidoId, user.id, zona.sucursalId)

      // Cada producto completo (con su receta y tamaños), una sola vez
      const ids = [...new Set(resultado.disponibles.map((l) => l.productoId))]
      const productos = new Map<number, ProductoBackend>(
        await Promise.all(ids.map(async (id) => [id, await getProductoDetalle(id, zona.sucursalId)] as const)),
      )

      const noDisponibles = [...resultado.noDisponibles]
      let agregados = 0
      for (const linea of resultado.disponibles) {
        const producto = productos.get(linea.productoId)
        if (!producto || !producto.disponible) {
          noDisponibles.push({ nombre: producto?.nombre ?? 'Un producto', cantidad: linea.cantidad, motivo: 'No hay stock en tu sucursal' })
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
        disabled={cargando}
        className="inline-flex items-center gap-2 rounded-full border border-brand-dark/20 bg-white px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:border-brand-dark disabled:opacity-50"
      >
        <RotateCcw size={16} />
        {cargando ? 'Cargando...' : 'Repetir pedido'}
      </button>
      {error && <p className="mt-2 text-sm font-semibold text-brand-red">{error}</p>}

      <Modal
        isOpen={resumen !== null}
        onClose={() => setResumen(null)}
        title={resumen && resumen.agregados > 0 ? 'Listo, lo cargamos en tu carrito' : 'No pudimos repetir el pedido'}
      >
        {resumen && (
          <div className="flex flex-col gap-4">
            {resumen.agregados > 0 && (
              <p className="text-gray-700">
                Agregamos <span className="font-bold">{resumen.agregados}</span>{' '}
                {resumen.agregados === 1 ? 'producto' : 'productos'} a tu carrito.
              </p>
            )}

            {resumen.preciosCambiaron && (
              <p className="rounded-xl bg-brand-cream p-3 text-sm text-brand-dark">
                Los precios se actualizaron a los de hoy, así que el total puede ser distinto al del pedido anterior.
              </p>
            )}

            {resumen.noDisponibles.length > 0 && (
              <div>
                <p className="font-bold text-brand-dark">No pudimos agregar:</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {resumen.noDisponibles.map((n, i) => (
                    <li key={i} className="rounded-xl border border-brand-dark/10 p-3 text-sm">
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

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setResumen(null)}
                className="rounded-full border border-brand-dark/20 px-5 py-2 font-bold text-brand-dark hover:border-brand-dark"
              >
                Cerrar
              </button>
              {resumen.agregados > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/carrito')}
                  className="rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90"
                >
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