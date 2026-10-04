import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import CustomizeSheet from './product/CustomizeSheet'
import SelectorTamanio from './product/SelectorTamanio'
import { useCart } from '../context/CartContext'
import { getProductoDetalle } from '../services/productService'
import { ordenarTamanios } from '../config/combo'
import { formatearPrecio } from '../utils/precio'
import type { CartItem } from '../types/cart'
import type { ProductIngredient, ProductoBackend } from '../types/product'

type Cantidades = Record<number, number>

// Lo guardado en el carrito, como "insumoId -> cantidad final"
function cantidadesDe(item: CartItem): Cantidades {
  return Object.fromEntries((item.personalizaciones ?? []).map((p) => [p.insumoId, p.cantidad]))
}

// Lo que suman los extras (sacar un ingrediente no descuenta)
function precioExtras(ingredientes: ProductIngredient[], cantidades: Cantidades) {
  return ingredientes.reduce((suma, ing) => {
    const final = cantidades[ing.insumoId] ?? ing.cantidadBase
    return suma + Math.max(0, final - ing.cantidadBase) * ing.precioComercial
  }, 0)
}

// El mismo texto que arma el detalle del producto
function textosDe(ingredientes: ProductIngredient[], cantidades: Cantidades) {
  return ingredientes
    .filter((ing) => cantidades[ing.insumoId] !== undefined)
    .map((ing) => {
      const final = cantidades[ing.insumoId]
      if (final === 0) return `Sin ${ing.nombre}`
      if (final > ing.cantidadBase) return `${final - ing.cantidadBase} ${ing.nombre} extra`
      return `${ing.nombre} x${final}`
    })
}

interface EditarItemModalProps {
  item: CartItem | null // null = cerrado
  onClose: () => void
}

function EditarItemModal({ item, onClose }: EditarItemModalProps) {
  const { reemplazarItem } = useCart()
  const [producto, setProducto] = useState<ProductoBackend | null>(null)
  const [tamanioId, setTamanioId] = useState<number | null>(null)
  const [cantidades, setCantidades] = useState<Cantidades>({})
  const [personalizando, setPersonalizando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Al abrir, trae el producto actualizado y carga lo que ya estaba elegido
  useEffect(() => {
    if (!item) return
    setCargando(true)
    setError('')
    setProducto(null)
    setPersonalizando(false)

    getProductoDetalle(item.product.id)
      .then((p) => {
        setProducto(p)
        setTamanioId(item.tamanioId ?? ordenarTamanios(p.tamanios)[0]?.tamanioId ?? null)
        setCantidades(cantidadesDe(item))
      })
      .catch(() => setError('No pudimos cargar el producto. Probá de nuevo.'))
      .finally(() => setCargando(false))
  }, [item])

  const ingredientes = producto?.ingredientes ?? []
  const tamanios = useMemo(() => ordenarTamanios(producto?.tamanios), [producto])
  const esCombo = Boolean(item?.combo?.length)
  const personalizable = ingredientes.some((i) => i.esRemovible || i.esAgregable)

  function precioBaseDe(id: number | null) {
    const t = tamanios.find((x) => x.tamanioId === id)
    return t ? Number(t.precio) : Number(producto?.precio ?? 0)
  }

  // Lo que el combo cobra de más por las opciones elegidas: acá no se edita, se conserva
  const recargoCombo =
    item && producto
      ? Math.max(
          0,
          item.unitPrice - precioBaseDe(item.tamanioId ?? null) - precioExtras(ingredientes, cantidadesDe(item)),
        )
      : 0

  const unitPrice = precioBaseDe(tamanioId) + precioExtras(ingredientes, cantidades) + recargoCombo
  const textos = textosDe(ingredientes, cantidades)

  function guardar() {
    if (!item || !producto) return

    // Se conservan los textos que no son de personalización (las opciones del combo)
    const textosViejos = textosDe(ingredientes, cantidadesDe(item))
    const otrosTextos = item.selectedOptions.filter((t) => !textosViejos.includes(t))

    reemplazarItem(item.id, producto, [...otrosTextos, ...textos], {
      unitPrice,
      personalizaciones: Object.entries(cantidades).map(([insumoId, cantidad]) => ({
        insumoId: Number(insumoId),
        cantidad,
      })),
      tamanioId,
      combo: item.combo,
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
          <div className="flex flex-col gap-5 ">
            {/* En un combo, cambiar el tamaño cambia las opciones y sus precios: se arma de nuevo */}
            {esCombo ? (
              <p className="text-sm text-gray-800">
                Para cambiar el tamaño o las opciones del combo, quitalo del carrito y armalo de nuevo.
              </p>
            ) : (
              tamanios.length > 0 && (
                <SelectorTamanio tamanios={tamanios} valor={tamanioId} onChange={setTamanioId} />
              )
            )}

            {personalizable && (
              <div className="flex items-start justify-between gap-3 border-b border-brand-dark/10 pb-4">
                <div className="min-w-0">
                  <p className="font-bold text-brand-dark">Ingredientes</p>
                  <p className="text-sm text-gray-800">{textos.join(' · ') || 'Como viene'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPersonalizando(true)}
                  className="shrink-0 text-sm font-semibold text-brand-dark underline hover:text-brand-red"
                >
                  Personalizar
                </button>
              </div>
            )}

            {!personalizable && (esCombo || tamanios.length === 0) && (
              <p className="text-sm text-gray-800">Este producto no tiene opciones para cambiar.</p>
            )}

            {!producto.disponible && (
              <p className="text-sm font-semibold text-brand-red">Este producto ya no está disponible.</p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <div>
                <p className="text-xs text-gray-800">
                  {item.quantity > 1 ? `${item.quantity} x ${formatearPrecio(unitPrice)}` : 'Precio'}
                </p>
                <p className="text-2xl font-extrabold text-brand-dark">{formatearPrecio(unitPrice * item.quantity)}</p>
              </div>
              <button
                type="button"
                onClick={guardar}
                disabled={!producto.disponible}
                className="rounded-full px-6 py-2 font-bold text-white transition-opacity
                 hover:opacity-90 disabled:opacity-50
                 bg-gradient-to-t from-red-600 to-red-400 border border-black"
              >
                Guardar
              </button>
            </div>

            {personalizando && (
              <CustomizeSheet
                ingredientes={ingredientes}
                cantidades={cantidades}
                precioBase={precioBaseDe(tamanioId)}
                onClose={() => setPersonalizando(false)}
                onGuardar={(nuevas) => {
                  setCantidades(nuevas)
                  setPersonalizando(false)
                }}
              />
            )}
          </div>
        )
      )}
    </Modal>
  )
}

export default EditarItemModal