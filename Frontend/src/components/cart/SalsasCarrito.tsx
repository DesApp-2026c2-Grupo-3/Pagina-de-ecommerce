import { useEffect, useMemo, useState } from 'react'
import { Flame } from 'lucide-react'
import QuantityStepper from '../product/QuantityStepper'
import { useCart } from '../../context/CartContext'
import { useToast } from '../../context/ToastContext'
import { useZona } from '../../context/ZonaContext'
import { getCategories, getProducts } from '../../services/productService'
import { normalizarNombre } from '../../config/gruposCatalogo'
import { formatearPrecio } from '../../utils/precio'
import type { ProductoBackend } from '../../types/product'

// Las salsas se ofrecen solo si el pedido tiene algo de almuerzo o cena que acompañar
const CATEGORIAS_QUE_JUSTIFICAN = [
  'hamburguesas',
  'hamburguesa',
  'combos',
  'papas fritas',
  'nuggets',
  'ensaladas',
  'sin tacc',
  'cajita magica',
]
const CATEGORIA_SALSAS = 'salsas'
const SALSA_OPCIONAL = 'salsa picante de la casa'
const MAXIMO_POR_SALSA = 5

interface Catalogo {
  salsas: ProductoBackend[]
  idSalsas: number | null
  justifican: Set<number>
}

// "¿Le sumás una salsa?": aparece en el carrito arriba de las notas para la cocina.
// Las salsas son productos comunes (categoría Salsas) que no se ven en el menú.
function SalsasCarrito() {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const { zona } = useZona()
  const { showToast } = useToast()
  const sucursalId = zona?.sucursalId ?? null
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)

  useEffect(() => {
    let vigente = true
    Promise.all([getProducts(sucursalId), getCategories()])
      .then(([productos, categorias]) => {
        if (!vigente) return
        const idSalsas = categorias.find((c) => normalizarNombre(c.nombre) === CATEGORIA_SALSAS)?.id ?? null
        const justifican = new Set(
          categorias.filter((c) => CATEGORIAS_QUE_JUSTIFICAN.includes(normalizarNombre(c.nombre))).map((c) => c.id),
        )
        setCatalogo({ salsas: productos.filter((p) => p.categoriaId === idSalsas), idSalsas, justifican })
      })
      .catch(() => vigente && setCatalogo(null))
    return () => {
      vigente = false
    }
  }, [sucursalId])

  const hayPlato = Boolean(catalogo && items.some((i) => catalogo.justifican.has(i.product.categoriaId)))
  const lineasSalsa = useMemo(
    () => (catalogo?.idSalsas ? items.filter((i) => i.product.categoriaId === catalogo.idSalsas) : []),
    [items, catalogo],
  )

  // Recaudos: una salsa no puede quedar en el pedido si ya no hay un plato que acompañar, o si dejó de
  // estar disponible en la sucursal (sin stock, borrada o cambio de zona).
  useEffect(() => {
    if (!catalogo || lineasSalsa.length === 0) return
    const sinPlato = !hayPlato
    const nodisponibles = lineasSalsa.filter((l) => {
      const actual = catalogo.salsas.find((s) => s.id === l.product.id)
      return !actual || !actual.disponible
    })
    const aQuitar = sinPlato ? lineasSalsa : nodisponibles
    if (aQuitar.length === 0) return
    aQuitar.forEach((l) => removeItem(l.id))
    showToast(
      sinPlato
        ? 'Quitamos las salsas porque tu pedido ya no tiene un plato para acompañar.'
        : `${aQuitar.map((l) => l.product.nombre).join(', ')}: ya no está disponible en tu sucursal y lo quitamos del pedido.`,
      4000,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogo, hayPlato, lineasSalsa])

  if (!catalogo || !hayPlato) return null
  const disponibles = catalogo.salsas.filter((s) => s.disponible)
  if (disponibles.length === 0) return null

  const picante = disponibles.find((s) => normalizarNombre(s.nombre) === SALSA_OPCIONAL)
  const comunes = disponibles.filter((s) => s !== picante)
  const linea = (p: ProductoBackend) => lineasSalsa.find((l) => l.product.id === p.id)

  function cambiarCantidad(p: ProductoBackend, cantidad: number) {
    const actual = linea(p)
    if (cantidad <= 0) {
      if (actual) removeItem(actual.id)
    } else if (actual) {
      updateQuantity(actual.id, cantidad)
    } else {
      addItem(p, cantidad)
    }
  }

  return (
    <section className="rounded-2xl border-2 border-brand-dark bg-white p-4" aria-labelledby="salsas-titulo">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id="salsas-titulo" className="font-display text-xl font-extrabold">
          ¿Le sumás una salsa?
        </h2>
        <span className="text-sm font-bold text-brand-muted">Opcional</span>
      </div>

      <ul className="flex flex-col divide-y-2 divide-dashed divide-brand-sand">
        {comunes.map((salsa) => (
          <li key={salsa.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="font-bold leading-tight">{salsa.nombre}</p>
              <p className="text-sm font-semibold text-brand-muted">{formatearPrecio(Number(salsa.precio))}</p>
            </div>
            <QuantityStepper
              value={linea(salsa)?.quantity ?? 0}
              onChange={(c) => cambiarCantidad(salsa, c)}
              min={0}
              max={MAXIMO_POR_SALSA}
              label={salsa.nombre}
            />
          </li>
        ))}

        {picante && (
          <li className="py-2.5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(linea(picante))}
                onChange={(e) => cambiarCantidad(picante, e.target.checked ? 1 : 0)}
                className="h-5 w-5 shrink-0 accent-brand-red"
              />
              <Flame className="h-5 w-5 shrink-0 text-brand-red" aria-hidden="true" />
              <span className="min-w-0 flex-1 font-bold leading-tight">{picante.nombre}</span>
              <span className="font-bold text-brand-muted">+{formatearPrecio(Number(picante.precio))}</span>
            </label>
          </li>
        )}
      </ul>
    </section>
  )
}

export default SalsasCarrito
