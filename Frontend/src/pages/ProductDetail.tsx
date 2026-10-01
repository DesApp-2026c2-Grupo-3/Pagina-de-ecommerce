import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategories, getProductoDetalle, getProducts } from '../services/productService'
import type { Category, ProductoBackend } from '../types/product'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import Stepper from '../components/Stepper'
import PersonalizarIngredientes from '../components/PersonalizarIngredientes'
import SelectorTamanio from '../components/SelectorTamanio'
import { COMBO, SABORES, etiquetaTamanio, ordenarVariantes } from '../config/combo'
import { formatearPrecio as precio, precioDe, precioDesde } from '../utils/precio'
import {
  personalizacionesDe,
  precioExtras as calcularPrecioExtras,
  textoPersonalizacion as textoDe,
} from '../utils/personalizacion'
import { CornerDownLeft } from 'lucide-react'

const PASOS = ['Hamburguesa', 'Papas', 'Bebida', 'Resumen']

interface Eleccion {
  id: number
  tamanio: string | null
}

// ---------- Piezas visuales ----------

interface OpcionProps {
  elegida: boolean
  onClick: () => void
  titulo: string
  detalle?: string
  imagen?: string
  icono: string
}

// Tarjeta seleccionable para papas y bebidas
function Opcion({ elegida, onClick, titulo, detalle, imagen, icono }: OpcionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={elegida}
      className={`flex items-center gap-3 rounded-2xl border-2 p-2 text-left transition-colors ${
        elegida ? 'border-brand-red bg-brand-red/5' : 'border-brand-dark/10 hover:border-brand-red/40'
      }`}
    >
      {imagen ? (
        <img src={imagen} alt="" className="h-11 w-11 shrink-0 rounded-lg bg-brand-cream object-cover" />
      ) : (
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-cream text-xl" aria-hidden="true">
          {icono}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-brand-dark">{titulo}</span>
        {detalle && <span className="block text-sm text-gray-600">{detalle}</span>}
      </span>
    </button>
  )
}

interface LineaResumenProps {
  titulo: string
  detalle: string
  monto: string
  onCambiar: () => void
}

function LineaResumen({ titulo, detalle, monto, onCambiar }: LineaResumenProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-dark/10 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="font-bold text-brand-dark">{titulo}</p>
        <p className="text-sm text-gray-600">{detalle}</p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-bold text-brand-dark">{monto}</span>
        <button type="button" onClick={onCambiar} className="text-xs font-semibold text-brand-red hover:underline">
          Cambiar
        </button>
      </div>
    </div>
  )
}

// ---------- Pantalla ----------

function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ProductoBackend>()
  const [categorias, setCategorias] = useState<Category[]>([])
  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [loading, setLoading] = useState(true)

  // Armado del pedido
  const [paso, setPaso] = useState(1)
  const [quitados, setQuitados] = useState<Set<number>>(new Set())
  const [extras, setExtras] = useState<Set<number>>(new Set())
  const [papa, setPapa] = useState<Eleccion | null>(null)
  const [bebida, setBebida] = useState<Eleccion | null>(null)
  const [sabor, setSabor] = useState<string | null>(null)

  // Producto suelto con tamaños (ej: unas papas solas)
  const [tamanioSimple, setTamanioSimple] = useState<string | null>(null)

  const { addItem } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setPaso(1)
    setQuitados(new Set())
    setExtras(new Set())
    setPapa(null)
    setBebida(null)
    setSabor(null)
    setTamanioSimple(null)

    Promise.all([getProductoDetalle(Number(id)), getCategories(), getProducts()])
      .then(([producto, cats, productos]) => {
        setProduct(producto)
        setCategorias(cats)
        setCatalogo(productos)
      })
      // Si el producto no existe, el backend responde 404 y se muestra "Producto no encontrado"
      .catch(() => setProduct(undefined))
      .finally(() => setLoading(false))
  }, [id])

  const nombreCategoria = (categoriaId?: number | null) =>
    categorias.find((c) => c.id === categoriaId)?.nombre ?? ''

  const categoryName = nombreCategoria(product?.categoriaId)
  const esArmable = COMBO.categoriasArmables.includes(categoryName)

  // ---------- Papas y bebidas ----------
  const opcionesDe = (categoriasDelPaso: string[]) =>
    catalogo.filter((p) => p.disponible && categoriasDelPaso.includes(nombreCategoria(p.categoriaId)))
  const papas = opcionesDe(COMBO.acompanamientos)
  const bebidas = opcionesDe(COMBO.bebidas)

  // Solo se muestran los sabores que tienen bebidas cargadas
  const saboresDisponibles = SABORES.filter((s) => bebidas.some((b) => b.sabor === s.valor))
  const saborActivo = saboresDisponibles.some((s) => s.valor === sabor) ? sabor : null
  const bebidasFiltradas = saborActivo ? bebidas.filter((b) => b.sabor === saborActivo) : bebidas

  const papaProducto = papa ? catalogo.find((p) => p.id === papa.id) : undefined
  const bebidaProducto = bebida ? catalogo.find((p) => p.id === bebida.id) : undefined

  // Al elegir un producto, arranca en su primer tamaño (regular)
  function elegir(producto: ProductoBackend): Eleccion {
    return { id: producto.id, tamanio: ordenarVariantes(producto.variantes)[0]?.tamanio ?? null }
  }

  // ---------- Hamburguesa ----------
  const ingredientes = product?.ingredientes ?? []
  const eleccion = { quitados, extras }

  // ---------- Precios ----------
  const precioHamburguesa = Number(product?.precio ?? 0) + calcularPrecioExtras(ingredientes, eleccion)
  const precioPapa = papaProducto && papa ? precioDe(papaProducto, papa.tamanio) : 0
  const precioBebida = bebidaProducto && bebida ? precioDe(bebidaProducto, bebida.tamanio) : 0
  const total = precioHamburguesa + precioPapa + precioBebida

  // Texto para el carrito, ej: ["Sin Cebolla", "Extra Cheddar (+$500)"]
  const textoPersonalizacion = () => textoDe(ingredientes, eleccion)

  function textoTamanio(producto: ProductoBackend, tamanio: string | null) {
    const etiqueta = producto.variantes?.find((v) => v.tamanio === tamanio)?.etiqueta
    return etiquetaTamanio(tamanio, etiqueta)
  }

  // Cada parte entra al carrito como una línea: así el backend calcula precios y stock sin cambios
  function agregarCombo() {
    if (!product?.disponible) return
    addItem(product, 1, textoPersonalizacion(), {
      unitPrice: precioHamburguesa,
      personalizaciones: personalizacionesDe(ingredientes, eleccion),
    })
    if (papaProducto && papa) addItem(papaProducto, 1, [], { tamanio: papa.tamanio })
    if (bebidaProducto && bebida) addItem(bebidaProducto, 1, [], { tamanio: bebida.tamanio })
    showToast(
      papaProducto || bebidaProducto
        ? `${product.nombre} y su combo se agregaron al carrito`
        : `${product.nombre} se agregó al carrito`,
    )
    navigate('/carrito')
  }

  function agregarSimple(tamanio: string | null) {
    if (!product?.disponible) return
    addItem(product, 1, [], { tamanio })
    showToast(`${product.nombre} se agregó al carrito`)
    navigate('/carrito')
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
        <p className="text-gray-600">Cargando...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className='bg-brand-cream'>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center
      min-h-screen justify-center">
        <h1 className="text-3xl font-extrabold text-brand-dark">Producto no encontrado</h1>
        <p className="text-gray-600">El producto que buscás no existe o ya no está disponible.</p>
        <Link
          to="/catalogo"
          className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
        >
          Volver al catálogo
        </Link>
      </div>
      </div>
    )
  }

  // Producto suelto: el tamaño elegido, o el primero (regular) si todavía no eligió
  const tamanioElegido = tamanioSimple ?? ordenarVariantes(product.variantes)[0]?.tamanio ?? null

  const filtrosSabor: { valor: string | null; etiqueta: string }[] = [
    { valor: null, etiqueta: 'Todas' },
    ...saboresDisponibles,
  ]

  return (
    <div className='bg-gradient-to-b from-orange-200 via-yellow-800 to-red-900'>
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-12 min-h-screen  ">
      
      <Link to="/catalogo" 
      className="inline-flex items-center gap-2 rounded-full bg-brand-red/10 
      px-4 py-2 font-semibold text-brand-red transition-all hover:bg-brand-red hover:text-white">
        <CornerDownLeft size={22}/> Volver al catálogo
      </Link>
      
      <div className="w-full flex min-h-[80vh] items-center justify-center">

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10 
      rounded p-4 max-w-5xl border
      bg-gradient-to-b from-orange-700 via-orange-300 to-orange-300">
        {/* Producto: en celular, compacto (foto chica al lado del nombre) */}
        <div className="flex items-center gap-4 md:flex-col md:items-stretch">
          {product.imagen ? (
            <img
              src={product.imagen}
              alt={product.nombre}
              className="h-20 w-20 shrink-0 rounded-xl  object-cover md:h-96 md:w-full md:rounded-2xl"
            />
          ) : (
            <div
              className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-brand-cream text-3xl md:h-96 md:w-full md:rounded-2xl md:text-7xl"
              aria-hidden="true"
            >
              🍽️
            </div>
          )}
          <div>
            {categoryName && (
              <span className="rounded-full bg-brand-red px-3 py-1 text-xs font-bold text-white md:text-sm">
                {categoryName}
              </span>
            )}
            <h1 className="mt-2 text-2xl font-extrabold sm:text-4xl
            bg-gradient-to-r from-red-500 via-red-800 to-orange-700 bg-clip-text text-transparent w-fit">
              {product.nombre}
              </h1>
            <p className="mt-1 line-clamp-2 text-sm text-gray-700 md:line-clamp-none md:text-base">
              {product.descripcion}
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {!product.disponible ? (
            <>
              <span className="text-3xl font-extrabold text-gray-400">{precio(precioDesde(product))}</span>
              <p className="mt-2 font-semibold text-gray-500">No disponible por el momento</p>
              <button
                type="button"
                disabled
                className="mt-6 cursor-not-allowed rounded-full bg-gray-300 px-6 py-3 font-bold text-gray-500"
              >
                No disponible
              </button>
            </>
          ) : !esArmable ? (
            // ---------- Producto suelto ----------
            <div className="flex flex-col gap-5">
              <SelectorTamanio producto={product} valor={tamanioElegido} onChange={setTamanioSimple} />
              <div>
              <p className="text-md text-gray-800 font-bold">Total</p>
              <span className="text-2xl font-extrabold text-brand-red [-webkit-text-stroke:1px_black]">
                {precio(precioDe(product, tamanioElegido))}
              </span>
              </div>
              <button
                type="button"
                onClick={() => agregarSimple(tamanioElegido)}
                className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-opacity hover:opacity-90"
              >
                Agregar al carrito
              </button>
            </div>
          ) : (
            // ---------- Armado del pedido ----------
            <div className="flex flex-col gap-5">
              <Stepper pasos={PASOS} actual={paso} onIrA={setPaso} />

              {paso === 1 && (
                <PersonalizarIngredientes
                  ingredientes={ingredientes}
                  eleccion={eleccion}
                  onChange={(nueva) => {
                    setQuitados(nueva.quitados)
                    setExtras(nueva.extras)
                  }}
                />
              )}

              {paso === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Opcion elegida={papa === null} onClick={() => setPapa(null)} titulo="Sin papas" icono="✕" />
                    {papas.map((p) => (
                      <Opcion
                        key={p.id}
                        elegida={papa?.id === p.id}
                        onClick={() => setPapa(papa?.id === p.id ? papa : elegir(p))}
                        titulo={p.nombre}
                        detalle={p.variantes?.length ? `desde ${precio(precioDesde(p))}` : precio(Number(p.precio))}
                        imagen={p.imagen}
                        icono="🍟"
                      />
                    ))}
                  </div>
                  {papaProducto && papa && (
                    <SelectorTamanio
                      producto={papaProducto}
                      valor={papa.tamanio}
                      onChange={(tamanio) => setPapa({ ...papa, tamanio })}
                    />
                  )}
                </div>
              )}

              {paso === 3 && (
                <div className="flex flex-col gap-4">
                  {saboresDisponibles.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      {filtrosSabor.map((s) => (
                        <button
                          key={s.etiqueta}
                          type="button"
                          onClick={() => setSabor(s.valor)}
                          aria-pressed={saborActivo === s.valor}
                          className={`rounded-full border px-3 py-1 text-sm font-semibold transition-colors ${
                            saborActivo === s.valor
                              ? 'border-brand-red bg-brand-red text-white'
                              : 'border-brand-dark/20 text-brand-dark hover:border-brand-red hover:text-brand-red'
                          }`}
                        >
                          {s.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Opcion elegida={bebida === null} onClick={() => setBebida(null)} titulo="Sin bebida" icono="✕" />
                    {bebidasFiltradas.map((b) => (
                      <Opcion
                        key={b.id}
                        elegida={bebida?.id === b.id}
                        onClick={() => setBebida(bebida?.id === b.id ? bebida : elegir(b))}
                        titulo={b.nombre}
                        detalle={b.variantes?.length ? `desde ${precio(precioDesde(b))}` : precio(Number(b.precio))}
                        imagen={b.imagen}
                        icono="🥤"
                      />
                    ))}
                  </div>
                  {bebidaProducto && bebida && (
                    <SelectorTamanio
                      producto={bebidaProducto}
                      valor={bebida.tamanio}
                      onChange={(tamanio) => setBebida({ ...bebida, tamanio })}
                    />
                  )}
                </div>
              )}

              {paso === 4 && (
                <div>
                  <LineaResumen
                    titulo={product.nombre}
                    detalle={textoPersonalizacion().join(' · ') || 'Como viene'}
                    monto={precio(precioHamburguesa)}
                    onCambiar={() => setPaso(1)}
                  />
                  <LineaResumen
                    titulo={papaProducto?.nombre ?? 'Sin papas'}
                    detalle={papaProducto && papa ? textoTamanio(papaProducto, papa.tamanio) : ''}
                    monto={papaProducto ? precio(precioPapa) : '—'}
                    onCambiar={() => setPaso(2)}
                  />
                  <LineaResumen
                    titulo={bebidaProducto?.nombre ?? 'Sin bebida'}
                    detalle={bebidaProducto && bebida ? textoTamanio(bebidaProducto, bebida.tamanio) : ''}
                    monto={bebidaProducto ? precio(precioBebida) : '—'}
                    onCambiar={() => setPaso(3)}
                  />
                </div>
              )}

              {/* Total y navegación, siempre a la vista */}
              <div className="flex items-center justify-between gap-3 border-t border-brand-dark/10 pt-4">
                <div>
                  <p className="text-md text-gray-800 font-bold">Total</p>
                  <p className="text-2xl font-extrabold text-brand-red
                  [-webkit-text-stroke:1px_black]">
                    {precio(total)}</p>
                </div>
                <div className="flex gap-2">
                  {paso > 1 && (
                    <button
                      type="button"
                      onClick={() => setPaso(paso - 1)}
                      className="rounded-full border border-brand-dark/20 px-4 py-2 font-bold text-brand-dark transition-colors hover:border-brand-red hover:text-brand-red"
                    >
                      Atrás
                    </button>
                  )}
                  {paso < PASOS.length ? (
                    <button
                      type="button"
                      onClick={() => setPaso(paso + 1)}
                      className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={agregarCombo}
                      className="rounded-full bg-brand-red px-5 py-2 font-bold text-white transition-opacity hover:opacity-90"
                    >
                      Agregar al carrito
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}

export default ProductDetail