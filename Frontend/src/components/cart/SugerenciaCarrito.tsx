import { useEffect, useState } from 'react'
import { useCart } from '../../context/CartContext'
import { useZona } from '../../context/ZonaContext'
import { getCategories, getMasPedidos, getProducts } from '../../services/productService'
import { esCategoriaOculta, normalizarNombre } from '../../config/gruposCatalogo'
import { COMPLEMENTOS, INCLUYE } from '../../config/sugerencias'
import ProductCard from '../home/ProductCard'
import type { ProductoBackend } from '../../types/product'

const MAXIMO = 4
// Cuántos productos del ranking de ventas se piden (alcanza para ordenar cada categoría)
const TAMANIO_RANKING = 50

// Las reglas, con los nombres normalizados (sin tildes ni mayúsculas) para comparar fácil
const normalizarReglas = (reglas: Record<string, string[]>) =>
  new Map(Object.entries(reglas).map(([cat, lista]) => [normalizarNombre(cat), lista.map(normalizarNombre)]))
const COMPLEMENTOS_N = normalizarReglas(COMPLEMENTOS)
const INCLUYE_N = normalizarReglas(INCLUYE)

// Toma de a uno por lista (papa, bebida, papa, bebida...) hasta llegar al máximo
function intercalar<T>(listas: T[][], maximo: number): T[] {
  const resultado: T[] = []
  for (let i = 0; resultado.length < maximo && listas.some((l) => i < l.length); i++) {
    for (const lista of listas) {
      if (i < lista.length && resultado.length < maximo) resultado.push(lista[i])
    }
  }
  return resultado
}

// Sugerencias del carrito:
//  - Si el carrito tiene algo para completar (ej: hamburguesa → papas y bebida), sugiere eso,
//    lo más vendido de la sucursal primero y sin repetir lo que ya se pidió.
//  - Si no, los más vendidos de la sucursal que todavía no están en el carrito.
function SugerenciasCarrito() {
  const { items } = useCart()
  const { zona } = useZona()
  const sucursalId = zona?.sucursalId ?? null

  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [ranking, setRanking] = useState<number[]>([])
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])

  useEffect(() => {
    Promise.all([getMasPedidos(sucursalId, TAMANIO_RANKING), getProducts(sucursalId), getCategories()])
      .then(([masPedidos, productos, cats]) => {
        setRanking(masPedidos.map((r) => r.productoId))
        setCatalogo(productos)
        setCategorias(cats)
      })
      .catch(() => {
        setRanking([])
        setCatalogo([])
        setCategorias([])
      })
  }, [sucursalId])

  const categoriaDe = new Map(categorias.map((c) => [c.id, normalizarNombre(c.nombre)]))
  // Las categorías ocultas (salsas) no se venden: nunca se sugieren
  const ocultas = new Set(categorias.filter((c) => esCategoriaOculta(c.nombre)).map((c) => c.id))
  const enCarrito = new Set(items.map((i) => i.product.id))

  // Lo que se puede sugerir: disponible en la sucursal, visible y que no esté ya en el carrito
  const disponibles = catalogo.filter((p) => p.disponible && !ocultas.has(p.categoriaId) && !enCarrito.has(p.id))

  // Orden por ventas: primero los del ranking (en su orden), después el resto
  const posicion = new Map(ranking.map((id, i) => [id, i]))
  const porVentas = (a: ProductoBackend, b: ProductoBackend) =>
    (posicion.get(a.id) ?? Infinity) - (posicion.get(b.id) ?? Infinity)

  // Qué categorías ya tiene el pedido (un combo suma las que trae adentro)
  const yaTiene = new Set<string>()
  for (const item of items) {
    const categoria = categoriaDe.get(item.product.categoriaId)
    if (!categoria) continue
    yaTiene.add(categoria)
    for (const incluida of INCLUYE_N.get(categoria) ?? []) yaTiene.add(incluida)
  }

  // Qué categorías completarían el pedido, en el orden en que se agregaron los productos
  const aCompletar: string[] = []
  for (const item of items) {
    const categoria = categoriaDe.get(item.product.categoriaId)
    for (const complemento of COMPLEMENTOS_N.get(categoria ?? '') ?? []) {
      if (!yaTiene.has(complemento) && !aCompletar.includes(complemento)) aCompletar.push(complemento)
    }
  }

  const complementos = intercalar(
    aCompletar.map((categoria) =>
      disponibles.filter((p) => categoriaDe.get(p.categoriaId) === categoria).sort(porVentas),
    ),
    MAXIMO,
  )

  // Sin nada para completar: los más vendidos que todavía no están en el carrito
  const completando = complementos.length > 0
  const sugerencias = completando
    ? complementos
    : disponibles.filter((p) => posicion.has(p.id)).sort(porVentas).slice(0, MAXIMO)

  if (sugerencias.length === 0) return null

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16">
      <h2 className="mb-6 font-display text-3xl font-extrabold tracking-tight">
        {completando ? (
          <>
            Completá tu <span className="text-brand-red">pedido</span>
          </>
        ) : (
          <>
            ¿Le <span className="text-brand-red">sumás</span> algo?
          </>
        )}
      </h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {sugerencias.map((producto) => (
          <ProductCard key={producto.id} product={producto} />
        ))}
      </div>
    </section>
  )
}

export default SugerenciasCarrito