import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategories, getProductoDetalle, getProducts } from '../services/productService'
import type { Category, ComboGrupo, ProductIngredient, ProductoBackend } from '../types/product'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { ordenarTamanios } from '../config/combo'
import ChoiceSheet, { type OpcionElegible } from '../components/product/ChoiceSheet'
import CustomizeSheet from '../components/product/CustomizeSheet'
import QuantityStepper from '../components/product/QuantityStepper'
import SelectorTamanio from '../components/product/SelectorTamanio'

function precio(n: number) {
  return `$${n.toLocaleString('es-AR')}`
}

// Precio de un producto en un tamaño (o el precio único si no tiene tamaños)
function precioEn(p: ProductoBackend, tamanioId: number | null): number | null {
  if (!p.tamanios || p.tamanios.length === 0) return Number(p.precio)
  const t = p.tamanios.find((x) => x.tamanioId === tamanioId)
  return t ? Number(t.precio) : null
}

function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  // Con key, al pasar de un producto a otro el estado (cantidad, elecciones) arranca de cero
  return <DetalleProducto key={id} id={Number(id)} />
}

function DetalleProducto({ id }: { id: number }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [product, setProduct] = useState<ProductoBackend | null>(null)
  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [cantidad, setCantidad] = useState(1)
  const [tamanioId, setTamanioId] = useState<number | null>(null)
  // Cantidad final por insumo, solo de los que el cliente cambió respecto de la receta
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  const [personalizando, setPersonalizando] = useState(false)
  // Producto elegido en cada grupo del combo: id del grupo -> id del producto
  const [eleccion, setEleccion] = useState<Record<number, number>>({})
  const [grupoAbierto, setGrupoAbierto] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([getProductoDetalle(id), getCategories(), getProducts()])
      .then(([detalle, cats, productos]) => {
        setProduct(detalle)
        setCategorias(cats)
        setCatalogo([...productos].sort((a, b) => a.id - b.id))
        setTamanioId(ordenarTamanios(detalle.tamanios)[0]?.tamanioId ?? null)
      })
      // Si el producto no existe, el backend responde 404 y se muestra "Producto no encontrado"
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const nombreCategoria = (categoriaId?: number | null) =>
    categorias.find((c) => c.id === categoriaId)?.nombre ?? ''

  const categoryName = nombreCategoria(product?.categoriaId)
  // Un combo es un producto con grupos elegibles (acompañamiento, bebida, ...) cargados en la base
  const grupos = useMemo(() => [...(product?.grupos ?? [])].sort((a, b) => a.orden - b.orden), [product])
  const esCombo = grupos.length > 0
  const tamanios = useMemo(() => ordenarTamanios(product?.tamanios), [product])
  const tamanioActivo = tamanios.find((t) => t.tamanioId === tamanioId) ?? null

  // Insumos que el cliente puede tocar. Los "lugares" del combo se eligen aparte.
  const ingredientes: ProductIngredient[] = (product?.ingredientes ?? [])
  const personalizable = ingredientes.some((i) => i.esRemovible || i.esAgregable)

  const cantidadFinal = (ing: ProductIngredient) => cantidades[ing.insumoId] ?? ing.cantidadBase

  // Opciones de un grupo del combo, con lo que cuestan de más que la opción incluida.
  // La opción incluida es grupo.productoIncluidoId; si no existe en este tamaño, no hay recargo.
  function opcionesDe(grupo: ComboGrupo): OpcionElegible[] {
    const delGrupo = catalogo.filter((p) => p.categoriaId === grupo.categoriaId)
    const incluido = catalogo.find((p) => p.id === grupo.productoIncluidoId)
    const referencia = incluido ? precioEn(incluido, tamanioId) : null

    return delGrupo
      .filter((p) => p.disponible && precioEn(p, tamanioId) !== null)
      .map((p) => ({
        id: p.id,
        nombre: p.nombre,
        imagen: p.imagen,
        icono: grupo.icono ?? '🍽️',
        recargo: referencia === null ? 0 : Math.max(0, (precioEn(p, tamanioId) ?? 0) - referencia),
      }))
  }

  const opciones: Record<number, OpcionElegible[]> = Object.fromEntries(grupos.map((g) => [g.id, opcionesDe(g)]))
  const elegida = (grupo: ComboGrupo) => opciones[grupo.id]?.find((o) => o.id === eleccion[grupo.id]) ?? null

  // Cambiar el tamaño cambia las opciones disponibles y sus recargos: se vuelve a elegir
  function cambiarTamanio(nuevo: number) {
    setTamanioId(nuevo)
    setEleccion({})
  }

  const tocados = ingredientes.filter((i) => cantidades[i.insumoId] !== undefined)
  const precioBase = tamanioActivo ? Number(tamanioActivo.precio) : Number(product?.precio ?? 0)
  const precioExtras = tocados.reduce(
    (suma, i) => suma + Math.max(0, cantidadFinal(i) - i.cantidadBase) * i.precioComercial,
    0,
  )
  const recargoCombo = grupos.reduce((suma, g) => suma + (elegida(g)?.recargo ?? 0), 0)
  const precioUnitario = precioBase + precioExtras + recargoCombo
  const total = precioUnitario * cantidad

  const comboCompleto = grupos.every((g) => !g.obligatorio || eleccion[g.id] !== undefined)
  const grupoActivo = grupos.find((g) => g.id === grupoAbierto) ?? null
  const puedeAgregar = !!product?.disponible && comboCompleto

  function textoPersonalizacion() {
    return tocados.map((ing) => {
      const final = cantidadFinal(ing)
      if (final === 0) return `Sin ${ing.nombre}`
      if (final > ing.cantidadBase) return `${final - ing.cantidadBase} ${ing.nombre} extra`
      return `${ing.nombre} x${final}`
    })
  }

  function agregar(): boolean {
    if (!product || !puedeAgregar) return false

    const textos = textoPersonalizacion()
    const opcionesCombo = grupos.map((g) => {
      const o = elegida(g)
      return o ? `${o.nombre}${o.recargo > 0 ? ` (+${precio(o.recargo)})` : ''}` : ''
    })

    addItem(product, cantidad, [...opcionesCombo, ...textos].filter(Boolean), {
      unitPrice: precioUnitario,
      personalizaciones: tocados.map((ing) => ({ insumoId: ing.insumoId, cantidad: cantidadFinal(ing) })),
      tamanioId,
      combo: esCombo
        ? grupos
            .filter((g) => eleccion[g.id] !== undefined)
            .map((g) => ({ grupoId: g.id, productoId: eleccion[g.id] }))
        : undefined,
    })
    return true
  }

  function anadirAlCarrito() {
    if (agregar()) showToast(`${product?.nombre} agregado al carrito`)
  }

  function pagarAhora() {
    if (agregar()) navigate('/carrito')
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
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

  const filaGrupo = 'flex items-center gap-3 border-b border-brand-dark/10 py-4'
  const botonSeleccionar =
    'shrink-0 rounded-md border border-brand-red px-3 py-1.5 text-sm font-bold text-brand-red transition-colors hover:bg-brand-red hover:text-white'

  // Cantidad + total y los dos botones. En el celular los botones ocupan todo el ancho.
  const barraCompra = (movil: boolean) => (
    <>
      <div className={`flex items-center justify-between gap-4 pb-3 pt-4 ${movil ? 'px-4' : ''}`}>
        <QuantityStepper value={cantidad} onChange={setCantidad} min={1} max={20} label={product.nombre} />
        <span className="text-2xl font-extrabold text-brand-dark">{precio(total)}</span>
      </div>
      <div className={`grid grid-cols-2 ${movil ? 'pb-[env(safe-area-inset-bottom)]' : 'gap-3'}`}>
        <button
          type="button"
          onClick={pagarAhora}
          disabled={!puedeAgregar}
          className={`border border-brand-dark px-4 py-4 font-bold text-brand-dark transition-colors hover:bg-brand-cream disabled:cursor-not-allowed disabled:opacity-40 ${movil ? '' : 'rounded-full'}`}
        >
          Pagar ahora
        </button>
        <button
          type="button"
          onClick={anadirAlCarrito}
          disabled={!puedeAgregar}
          className={`bg-brand-red px-4 py-4 font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ${movil ? '' : 'rounded-full'}`}
        >
          Añadir al carrito
        </button>
      </div>
    </>
  )

  return (
    <div className="mx-auto max-w-5xl px-4 pt-4 md:pb-12 md:pt-8">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-2 text-base font-extrabold text-brand-dark hover:text-brand-red"
      >
        <span aria-hidden="true" className="text-2xl leading-none">‹</span>
        {categoryName || 'Volver al catálogo'}
      </Link>
      
      <div className="w-full flex min-h-[80vh] items-center justify-center">

      <div className="mt-4 grid gap-6 md:grid-cols-2 md:items-start md:gap-12">
        <div className="md:sticky md:top-24">
          {product.imagen ? (
            <img
              src={product.imagen}
              alt={product.nombre}
              className="mx-auto h-56 w-full max-w-sm object-contain sm:h-72 md:h-96 md:max-w-none"
            />
          ) : (
            <div
              aria-hidden="true"
              className="mx-auto grid h-56 w-full max-w-sm place-items-center rounded-3xl bg-brand-cream text-7xl sm:h-72 md:h-96 md:max-w-none"
            >
              🍔
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold text-brand-dark">{product.nombre}</h1>
          <p className="mt-2 text-xl font-extrabold text-brand-dark">{precio(precioBase)}</p>
          <p className="mt-3 text-gray-600">
            {product.descripcion}
            {esCombo && tamanioActivo && (
              <> Acompañamiento y bebida {tamanioActivo.tamanio} a elección.</>
            )}
          </p>

          {!product.disponible && (
            <p className="mt-4 rounded-2xl bg-brand-cream px-4 py-3 font-semibold text-brand-red">
              Este producto no está disponible por el momento.
            </p>
          )}

          <SelectorTamanio tamanios={tamanios} valor={tamanioId} onChange={cambiarTamanio} />

          {esCombo ? (
            <section className="mt-6" aria-label="Armá tu combo">
              <div className={filaGrupo}>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-brand-dark">{product.nombre}</p>
                  {personalizable && (
                    <button
                      type="button"
                      onClick={() => setPersonalizando(true)}
                      className="text-sm text-gray-600 underline hover:text-brand-red"
                    >
                      Personalizar
                    </button>
                  )}
                  {tocados.length > 0 && (
                    <p className="text-xs text-gray-500">{textoPersonalizacion().join(' · ')}</p>
                  )}
                </div>
              </div>

              {grupos.map((grupo) => {
                const elegido = elegida(grupo)
                return (
                  <div key={grupo.id} className={filaGrupo}>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-brand-dark">{grupo.nombre}</p>
                      {elegido ? (
                        <p className="text-sm text-gray-600">
                          {elegido.nombre}
                          {elegido.recargo > 0 && <> · +{precio(elegido.recargo)}</>}
                        </p>
                      ) : (
                        <p className="text-sm italic text-gray-500">
                          Elegí uno{grupo.obligatorio ? ' (Obligatorio)' : ' (Opcional)'}
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => setGrupoAbierto(grupo.id)} className={botonSeleccionar}>
                      {elegido ? 'Cambiar' : 'Seleccionar'}
                    </button>
                  </div>
                )
              })}
            </section>
          ) : (
            personalizable && (
              <section className="mt-6">
                <h2 className="text-lg font-extrabold text-brand-dark">Personaliza tu producto</h2>
                <div className="mt-3 border-b border-brand-dark/10 pb-4">
                  <p className="font-extrabold text-brand-dark">Personalizar</p>
                  <button
                    type="button"
                    onClick={() => setPersonalizando(true)}
                    className="text-gray-600 underline hover:text-brand-red"
                  >
                    Personalizar
                  </button>
                  {tocados.length > 0 && (
                    <p className="mt-1 text-sm text-gray-500">{textoPersonalizacion().join(' · ')}</p>
                  )}
                </div>
              </section>
            )
          )}

          {/* En pantallas grandes la barra de compra va dentro de la columna */}
          <div className="mt-8 hidden md:block">{barraCompra(false)}</div>
        </div>
      </div>

      {/* En el celular la barra queda pegada al pie de la pantalla mientras se ve el producto,
          pero dentro del flujo: al final de la página se apoya arriba del footer en vez de taparlo */}
      <div className="sticky bottom-0 z-30 -mx-4 mt-6 rounded-t-3xl bg-white shadow-[0_-6px_20px_rgba(0,0,0,0.12)] md:hidden">
        {barraCompra(true)}
      </div>

      {personalizando && (
        <CustomizeSheet
          ingredientes={ingredientes}
          cantidades={cantidades}
          precioBase={precioBase}
          onClose={() => setPersonalizando(false)}
          onGuardar={(nuevas) => {
            setCantidades(nuevas)
            setPersonalizando(false)
          }}
        />
      )}

      {grupoActivo && (
        <ChoiceSheet
          title={grupoActivo.nombre}
          opciones={opciones[grupoActivo.id] ?? []}
          seleccionadoId={eleccion[grupoActivo.id] ?? null}
          onClose={() => setGrupoAbierto(null)}
          onElegir={(opcionId) => {
            setEleccion((prev) => ({ ...prev, [grupoActivo.id]: opcionId }))
            setGrupoAbierto(null)
          }}
        />
      )}
    </div>
    </div>
    </div>
  )
}

export default ProductDetail
