import { useEffect, useState } from 'react'
import Modal from './Modal'
import PersonalizarIngredientes from './PersonalizarIngredientes'
import SelectorTamanio from './SelectorTamanio'
import { useCart } from '../context/CartContext'
import { getProductoDetalle } from '../services/productService'
import { ordenarVariantes } from '../config/combo'
import { formatearPrecio, precioDe } from '../utils/precio'
import {
  eleccionDesde,
  personalizacionesDe,
  precioExtras,
  textoPersonalizacion,
  type Eleccion,
} from '../utils/personalizacion'
import type { CartItem } from '../types/cart'
import type { ProductoBackend } from '../types/product'

interface EditarItemModalProps {
  item: CartItem | null // null = cerrado
  onClose: () => void
}

function EditarItemModal({ item, onClose }: EditarItemModalProps) {
  const { reemplazarItem } = useCart()
  const [producto, setProducto] = useState<ProductoBackend | null>(null)
  const [eleccion, setEleccion] = useState<Eleccion>({ quitados: new Set(), extras: new Set() })
  const [tamanio, setTamanio] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Al abrir, trae el producto actualizado (receta y tamaños) y marca lo que ya estaba elegido
  useEffect(() => {
    if (!item) return
    setCargando(true)
    setError('')
    setProducto(null)

    getProductoDetalle(item.product.id)
      .then((p) => {
        setProducto(p)
        setEleccion(eleccionDesde(p.ingredientes ?? [], item.personalizaciones))
        setTamanio(item.tamanio ?? ordenarVariantes(p.variantes)[0]?.tamanio ?? null)
      })
      .catch(() => setError('No pudimos cargar el producto. Probá de nuevo.'))
      .finally(() => setCargando(false))
  }, [item])

  const ingredientes = producto?.ingredientes ?? []
  const tieneTamanios = Boolean(producto?.variantes?.length)
  const unitPrice = producto ? precioDe(producto, tamanio) + precioExtras(ingredientes, eleccion) : 0

  function guardar() {
    if (!item || !producto) return
    reemplazarItem(item.id, producto, textoPersonalizacion(ingredientes, eleccion), {
      unitPrice,
      personalizaciones: personalizacionesDe(ingredientes, eleccion),
      tamanio,
    })
    onClose()
  }

  return (
    <Modal isOpen={item !== null} onClose={onClose} title={item ? `Editar ${item.product.nombre}` : 'Editar'}>
      {cargando ? (
        <p className="text-sm text-gray-600">Cargando...</p>
      ) : error ? (
        <p className="text-sm font-semibold text-brand-red">{error}</p>
      ) : (
        producto &&
        item && (
          <div className="flex flex-col gap-5">
            <SelectorTamanio producto={producto} valor={tamanio} onChange={setTamanio} />

            {ingredientes.length > 0 && (
              <PersonalizarIngredientes ingredientes={ingredientes} eleccion={eleccion} onChange={setEleccion} />
            )}

            {!tieneTamanios && ingredientes.length === 0 && (
              <p className="text-sm text-gray-600">Este producto no tiene opciones para cambiar.</p>
            )}

            {!producto.disponible && (
              <p className="text-sm font-semibold text-brand-red">Este producto ya no está disponible.</p>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-brand-dark/10 pt-4">
              <div>
                <p className="text-xs text-gray-500">
                  {item.quantity > 1 ? `${item.quantity} x ${formatearPrecio(unitPrice)}` : 'Precio'}
                </p>
                <p className="text-2xl font-extrabold text-brand-red">{formatearPrecio(unitPrice * item.quantity)}</p>
              </div>
              <button
                type="button"
                onClick={guardar}
                disabled={!producto.disponible}
                className="rounded-full bg-brand-red px-6 py-2 font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        )
      )}
    </Modal>
  )
}

export default EditarItemModal