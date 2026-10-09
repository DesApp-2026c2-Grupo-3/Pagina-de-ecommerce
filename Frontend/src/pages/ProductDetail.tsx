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
import { useZona } from '../context/ZonaContext'
import { ArrowLeft, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import CategoryIcon from '../components/icons/CategoryIcon'

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
  const { zona } = useZona()
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

  // Se vuelve a pedir si el cliente cambia de zona: la disponibilidad depende de la sucursal
  useEffect(() => {
    setLoading(true)
    Promise.all([getProductoDetalle(id, zona?.sucursalId), getCategories(), getProducts(zona?.sucursalId)])
      .then(([detalle, cats, productos]) => {
        setProduct(detalle)
        setCategorias(cats)
        setCatalogo([...productos].sort((a, b) => a.id - b.id))
        setTamanioId(ordenarTamanios(detalle.tamanios)[0]?.tamanioId ?? null)
      })
      // Si el producto no existe, el backend responde 404 y se muestra "Producto no encontrado"
      .catch((error) => {
        console.error('No se pudo cargar el detalle:', error)
        setProduct(null)
      })      .finally(() => setLoading(false))
  }, [id, zona?.sucursalId])

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
  function opcionesDe(grupo: ComboGrupo): OpcionElegible[] {
    const delGrupo = catalogo.filter((p) => p.categoriaId === grupo.categoriaId)
    // La opción más barata del lugar (en este tamaño) va incluida: las demás cobran la diferencia
    const precios = delGrupo.map((p) => precioEn(p, tamanioId)).filter((x): x is number => x !== null)
    const referencia = precios.length > 0 ? Math.min(...precios) : null

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

  // Lo que eligió el cliente, listo para el carrito o para una compra directa
  function armarEleccion() {
    const textos = textoPersonalizacion()
    const opcionesCombo = grupos.map((g) => {
      const o = elegida(g)
      return o ? `${o.nombre}${o.recargo > 0 ? ` (+${precio(o.recargo)})` : ''}` : ''
    })

    return {
      opciones: [...opcionesCombo, ...textos].filter(Boolean),
      extras: {
        unitPrice: precioUnitario,
        personalizaciones: tocados.map((ing) => ({ insumoId: ing.insumoId, cantidad: cantidadFinal(ing) })),
        tamanioId,
        combo: esCombo
          ? grupos
              .filter((g) => eleccion[g.id] !== undefined)
              .map((g) => ({ grupoId: g.id, productoId: eleccion[g.id] }))
          : undefined,
      },
    }
  }

  function anadirAlCarrito() {
    if (!product || !puedeAgregar) return
    const { opciones, extras } = armarEleccion()
    addItem(product, cantidad, opciones, extras)
    showToast(`${product.nombre} agregado al carrito`)
  }

  // Agrega el producto y lleva al carrito para revisar todo y pagar
  function pagarAhora() {
    if (!product || !puedeAgregar) return
    const { opciones, extras } = armarEleccion()
    addItem(product, cantidad, opciones, extras)
    navigate('/carrito')
  }

   if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-brand-cream px-4">
        <p className="font-display text-2xl font-extrabold text-brand-dark">Cargando...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="bg-brand-cream">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-4 py-24 text-center">
          <img src="/Otros/notFound.png" alt="" className="h-48" />
          <h1 className="font-display text-4xl font-extrabold text-brand-dark">Producto no encontrado</h1>
          <p className="text-brand-muted">El producto que buscás no existe o ya no está disponible.</p>
          <Link
            to="/catalogo"
            className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    )
  }

  const filaGrupo = 'flex items-center gap-3 border-b-2 border-dashed border-brand-sand py-4 last:border-b-0'
  const botonSeleccionar =
    'shrink-0 rounded-full border-2 border-brand-dark px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream'
  const botonPersonalizar =
    'mt-2 inline-flex items-center gap-2 rounded-full bg-brand-cream px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-mustard'

  // Cantidad + total y los dos botones. En el celular la barra es oscura y va pegada abajo.
  const barraCompra = (movil: boolean) => (
    <>
      <div className="flex items-center justify-between gap-4 pb-4">
        <QuantityStepper value={cantidad} onChange={setCantidad} min={1} max={20} label={product.nombre} />
        <div className="text-right">
          <p className={`text-xs font-bold uppercase tracking-wider ${movil ? 'text-brand-cream/60' : 'text-brand-muted'}`}>Total</p>
          <p className={`font-display text-3xl font-extrabold ${movil ? 'text-brand-cream' : 'text-brand-dark'}`}>{precio(total)}</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-3">
        <button
          type="button"
          onClick={pagarAhora}
          disabled={!puedeAgregar}
          className={`min-h-13 rounded-full border-2 px-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            movil
              ? 'border-brand-cream text-brand-cream hover:bg-brand-cream hover:text-brand-dark'
              : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-brand-cream'
          }`}
        >
          Pagar ahora
        </button>
        <button
          type="button"
          onClick={anadirAlCarrito}
          disabled={!puedeAgregar}
          className="flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-4 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ShoppingBag className="h-5 w-5" />
          Añadir al carrito
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      {/* Banda oscura arriba: la imagen y la tarjeta se montan sobre ella */}
      <div className="bg-brand-dark px-4 pb-40 pt-6">
        <div className="mx-auto max-w-6xl">
          <Link
            to="/catalogo"
            className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-cream/70 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft className="h-5 w-5" />
            Menú{categoryName && <span className="text-brand-cream/40">/ {categoryName}</span>}
          </Link>
        </div>
      </div>

      <div className="mx-auto -mt-36 grid max-w-6xl gap-8 px-4 pb-12 md:grid-cols-2 md:items-start md:gap-12">
        {/* Imagen sobre el recuadro rojo inclinado */}
        <div className="md:sticky md:top-28">
          <div className="relative mx-auto grid aspect-square w-full max-w-md rotate-2 place-items-center rounded-[2.5rem] border-2 border-brand-dark bg-brand-red">
            <div className="absolute inset-[8%] rounded-full bg-black/15" />
            {product.imagen ? (
              <img
                src={product.imagen}
                alt={product.nombre}
                className={`relative w-[85%] -rotate-2 object-contain drop-shadow-2xl ${product.disponible ? '' : 'opacity-60 grayscale'}`}
              />
            ) : (
              <CategoryIcon icono="generico" className="relative h-32 w-32 text-brand-cream" />
            )}
          </div>
        </div>

        {/* Tarjeta con la info y las opciones */}
        <div className="rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker sm:p-8">
          {categoryName && (
            <span className="inline-block rounded-full bg-brand-red px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
              {categoryName}
            </span>
          )}
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">{product.nombre}</h1>
          <p className="mt-3 text-2xl font-extrabold text-brand-red">{precio(precioBase)}</p>
          <p className="mt-3 leading-relaxed text-brand-muted">
            {product.descripcion}
            {esCombo && tamanioActivo && <> Acompañamiento y bebida {tamanioActivo.tamanio} a elección.</>}
          </p>

          {!product.disponible && (
            <p className="mt-4 rounded-2xl border-2 border-dashed border-brand-red/40 bg-brand-red/5 px-4 py-3 font-bold text-brand-red">
              Este producto no está disponible por el momento.
            </p>
          )}

          <SelectorTamanio tamanios={tamanios} valor={tamanioId} onChange={cambiarTamanio} />

          {esCombo ? (
            <section className="mt-6 border-t-2 border-dashed border-brand-sand pt-2" aria-label="Armá tu combo">
              <div className={filaGrupo}>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-extrabold">{product.nombre}</p>
                  {tocados.length > 0 && (
                    <p className="text-sm text-brand-muted">{textoPersonalizacion().join(' · ')}</p>
                  )}
                  {personalizable && (
                    <button type="button" onClick={() => setPersonalizando(true)} className={botonPersonalizar}>
                      <SlidersHorizontal className="h-4 w-4" /> Personalizar
                    </button>
                  )}
                </div>
              </div>

              {grupos.map((grupo) => {
                const elegido = elegida(grupo)
                return (
                  <div key={grupo.id} className={filaGrupo}>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold">{grupo.nombre}</p>
                      {elegido ? (
                        <p className="text-sm text-brand-muted">
                          {elegido.nombre}
                          {elegido.recargo > 0 && <> · +{precio(elegido.recargo)}</>}
                        </p>
                      ) : (
                        <p className={`text-sm font-semibold ${grupo.obligatorio ? 'text-brand-red' : 'text-brand-muted'}`}>
                          Elegí uno {grupo.obligatorio ? '(obligatorio)' : '(opcional)'}
                        </p>
                      )}
                    </div>
                    <button type="button" onClick={() => setGrupoAbierto(grupo.id)} className={botonSeleccionar}>
                      {elegido ? 'Cambiar' : 'Elegir'}
                    </button>
                  </div>
                )
              })}
            </section>
          ) : (
            personalizable && (
              <section className="mt-6 border-t-2 border-dashed border-brand-sand pt-5">
                <h2 className="font-display text-xl font-extrabold">Hacelo a tu manera</h2>
                {tocados.length > 0 && (
                  <p className="mt-1 text-sm text-brand-muted">{textoPersonalizacion().join(' · ')}</p>
                )}
                <button type="button" onClick={() => setPersonalizando(true)} className={botonPersonalizar}>
                  <SlidersHorizontal className="h-4 w-4" /> Sacá o sumá ingredientes
                </button>
              </section>
            )
          )}

          {/* En pantallas grandes la barra de compra va dentro de la tarjeta */}
          <div className="mt-8 hidden border-t-2 border-dashed border-brand-sand pt-6 md:block">{barraCompra(false)}</div>
        </div>
      </div>

      {/* En el celular la barra queda pegada al pie de la pantalla, dentro del flujo:
          al final de la página se apoya arriba del footer en vez de taparlo */}
      <div className="sticky bottom-0 z-30 rounded-t-[2rem] bg-brand-dark px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_24px_rgba(26,20,20,0.25)] md:hidden">
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
  )
}
export default ProductDetail