import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getCategories, getProductoDetalle, getProducts } from '../services/productService'
import type { Category, ComboGrupo, ProductIngredient, ProductoBackend } from '../types/product'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { etiquetaTamanio, ordenarTamanios } from '../config/combo'
import ChoiceSheet, { type OpcionElegible } from '../components/product/ChoiceSheet'
import { SIN_OPCION, eleccionPorDefecto, opcionesDeGrupo, textoSin } from '../utils/comboOpciones'
import { usePromociones } from '../hooks/usePromociones'
import { conDescuento } from '../utils/promosUtils'
import IngredientesEditables from '../components/product/IngredientesEditables'
import QuantityStepper from '../components/product/QuantityStepper'
import SelectorTamanio from '../components/product/SelectorTamanio'
import ImagenProducto from '../components/ui/ImagenProducto'
import { useZona } from '../context/ZonaContext'
import AvisoCierreSucursal from '../components/sucursal/AvisoCierreSucursal'
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import Stepper from '../components/Stepper'
import ModalConfirmarAgregar from '../components/product/ModalConfirmarAgregar'

function precio(n: number) {
  return `$${n.toLocaleString('es-AR')}`
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
  const { zona, abrirSelector } = useZona()
  const promos = usePromociones()
  const sucursalCerrada = Boolean(zona && zona.sucursalAbierta === false)

  const [product, setProduct] = useState<ProductoBackend | null>(null)

  const [productoPrincipal, setProductoPrincipal] = useState<ProductoBackend | null>(null)


  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [cantidad, setCantidad] = useState(1)
  const [tamanioId, setTamanioId] = useState<number | null>(null)
  // Cantidad final por insumo, solo de los que el cliente cambió respecto de la receta
  const [cantidades, setCantidades] = useState<Record<number, number>>({})
  // Producto elegido en cada grupo del combo: id del grupo -> id del producto
  const [eleccion, setEleccion] = useState<Record<number, number>>({})
  const [grupoAbierto, setGrupoAbierto] = useState<number | null>(null)
  // false = presentación inicial del producto; true = pasos para armarlo
  const [armando, setArmando] = useState(false)
  // Paso actual de la tarjeta (empieza en 1, como el Stepper)
  const [paso, setPaso] = useState(1)
  // Pregunta "¿Lo sumamos al carrito?" antes de agregarlo
  const [confirmandoAgregar, setConfirmandoAgregar] = useState(false)



  // Se vuelve a pedir si el cliente cambia de zona: la disponibilidad depende de la sucursal
  useEffect(() => {
    setLoading(true)
    setProductoPrincipal(null)

    Promise.all([getProductoDetalle(id, zona?.sucursalId), getCategories(), getProducts(zona?.sucursalId)])
      .then(async ([detalle, cats, productos]) => {
        setProduct(detalle)
        setCategorias(cats)
        setCatalogo([...productos].sort((a, b) => a.id - b.id))
        setTamanioId(ordenarTamanios(detalle.tamanios).at(0)?.tamanioId ?? null)


        // Si es un combo con productoPrincipalId, pedimos su detalle al backend
        if (detalle.productoPrincipalId) {
          try {
            const principal = await getProductoDetalle(detalle.productoPrincipalId, zona?.sucursalId)
            setProductoPrincipal(principal)
          } catch (err) {
            console.error('No se pudo cargar el producto principal del combo:', err)
          }
        }
      })
      .catch((error) => {
        console.error('No se pudo cargar el detalle:', error)
        setProduct(null)
      })
      .finally(() => setLoading(false))
  }, [id, zona?.sucursalId])


  const nombreCategoria = (categoriaId?: number | null) => categorias.find((c) => c.id === categoriaId)?.nombre ?? ''
  const categoryName = nombreCategoria(product?.categoriaId)

  const grupos = useMemo(() => [...(product?.grupos ?? [])].sort((a, b) => a.orden - b.orden), [product])
  const esCombo = grupos.length > 0
  const tamanios = useMemo(() => ordenarTamanios(product?.tamanios), [product])
  const tamanioActivo = tamanios.find((t) => t.tamanioId === tamanioId) ?? null

  const textoGruposCombo = (() => {
    const nombres = grupos.map((g) => g.nombre.toLowerCase())
    const lista = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : (nombres[0] ?? '')
    const conTamanio = tamanios.length > 1 && tamanioActivo ? ` ${tamanioActivo.tamanio}` : ''
    return `${lista.charAt(0).toUpperCase()}${lista.slice(1)}${conTamanio} a elección.`
  })()

  // Insumos que el cliente puede tocar. Los "lugares" del combo se eligen aparte.
  const ingredientes: ProductIngredient[] = product?.ingredientes ?? []
  const personalizable = ingredientes.some((i) => i.esRemovible || i.esAgregable)

  const cantidadFinal = (ing: ProductIngredient) => cantidades[ing.insumoId] ?? ing.cantidadBase

  const opciones: Record<number, OpcionElegible[]> = Object.fromEntries(
    grupos.map((g) => [g.id, opcionesDeGrupo(g, catalogo, tamanioId)]),
  )

  const eleccionDe = (grupo: ComboGrupo) => eleccion[grupo.id] ?? eleccionPorDefecto(grupo, opciones[grupo.id] ?? [])
  const sinOpcion = (grupo: ComboGrupo) => eleccionDe(grupo) === SIN_OPCION
  const elegida = (grupo: ComboGrupo) => opciones[grupo.id]?.find((o) => o.id === eleccionDe(grupo)) ?? null

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

  const semana = promos?.productoSemana
  const descuentoSemana = semana?.items.find((i) => i.productoId === product?.id)?.descuento ?? 0
  const precioLista = precioBase + precioExtras + recargoCombo
  const precioUnitario = descuentoSemana > 0 ? conDescuento(precioLista, descuentoSemana) : precioLista
  const total = precioUnitario * cantidad

  const comboCompleto = grupos.every((g) => !g.obligatorio || elegida(g) !== null)
  const grupoActivo = grupos.find((g) => g.id === grupoAbierto) ?? null
  const puedeAgregar = !!product?.disponible && comboCompleto
  const puedeComprar = puedeAgregar && !sucursalCerrada

  // Orden de pasos:
  // 1. Ingredientes (si el producto tiene ingredientes personalizables)
  // 2. Tu combo / Tamaño (si es combo o tiene múltiples tamaños)
  // 3. Resumen
  const pasos = [
    ...(personalizable ? [{ id: 'ingredientes', nombre: 'Ingredientes' }] : []),
    ...(esCombo || tamanios.length > 1 ? [{ id: 'opciones', nombre: esCombo ? 'Tu combo' : 'Tamaño' }] : []),
    { id: 'final', nombre: 'Resumen' },
  ]
  const pasoActual = pasos[paso - 1]?.id ?? 'final'
  const esUltimoPaso = paso >= pasos.length
  const puedeAvanzar = pasoActual !== 'opciones' || comboCompleto

  function irAPaso(destino: number) {
    const pasoCombo = pasos.findIndex((p) => p.id === 'opciones') + 1
    if (pasoCombo > 0 && destino > pasoCombo && !comboCompleto) {
      setPaso(pasoCombo)
      return
    }
    setPaso(destino)
  }

  function textoPersonalizacion() {
    return tocados.map((ing) => {
      const final = cantidadFinal(ing)
      if (final === 0) return `Sin ${ing.nombre}`
      if (final > ing.cantidadBase) return `${final - ing.cantidadBase} ${ing.nombre} extra`
      return `${ing.nombre} x${final}`
    })
  }

  function resumenEleccion() {
    return [
      tamanioActivo ? etiquetaTamanio(tamanioActivo.tamanio) : '',
      ...grupos.map((g) => (sinOpcion(g) ? textoSin(g) : (elegida(g)?.nombre ?? ''))),
      ...textoPersonalizacion(),
    ]
      .filter(Boolean)
      .join(' · ')
  }

  function armarEleccion() {
    const textos = textoPersonalizacion()
    const opcionesCombo = grupos.map((g) => {
      if (sinOpcion(g)) return textoSin(g)
      const o = elegida(g)
      return o ? `${o.nombre}${o.recargo > 0 ? ` (+${precio(o.recargo)})` : ''}` : ''
    })

    return {
      opciones: [...opcionesCombo, ...textos].filter(Boolean),
      extras: {
        unitPrice: precioUnitario,
        ...(descuentoSemana > 0 && semana
          ? { promoId: semana.id, descuento: descuentoSemana, precioLista, promoFija: false }
          : {}),
        personalizaciones: tocados.map((ing) => ({ insumoId: ing.insumoId, cantidad: cantidadFinal(ing) })),
        tamanioId,
        combo: esCombo
          ? grupos
            .filter((g) => elegida(g) !== null)
            .map((g) => ({ grupoId: g.id, productoId: elegida(g)!.id }))
          : undefined,
      },
    }
  }

  function anadirAlCarrito() {
    if (!product || !puedeComprar) return
    const { opciones, extras } = armarEleccion()
    addItem(product, cantidad, opciones, extras)
    showToast(`${product.nombre} agregado al carrito`, { tema: 'mostaza' })
    // Después de confirmar, vuelve al menú en la categoría del producto (Combos › Carne, por ejemplo)
    navigate(`/catalogo?categoria=${product.categoriaId}`)
  }


  function empezarAArmar() {
    if (!product || !product.disponible || sucursalCerrada) return
    setPaso(1)
    setArmando(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function volverAlProducto() {
    setArmando(false)
    setPaso(1)
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
            className="rounded-full bg-brand-red px-6 py-3 font-bold text-white transition-transform hover:translate-y-0.5"
          >
            Volver al menú
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================
  // CONSTANTES DE ESTILO (Tailwind refactorizado)
  // ==========================================
 const layoutGridClase =
  'mx-auto -mt-24 grid max-w-xl justify-items-center gap-5 px-4 pb-32 sm:-mt-36 sm:gap-8 lg:max-w-6xl lg:grid-cols-2 lg:items-start lg:justify-items-stretch lg:gap-12 lg:pb-12 [&>*]:min-w-0'
 const marcoImagenClase =
    'relative mx-auto grid aspect-square h-auto w-full max-w-[280px] rotate-2 place-items-center rounded-[2rem] border-2 border-brand-dark bg-brand-red sm:max-w-[288px] sm:rounded-[2.5rem] md:max-w-md'
  const imgProductoClase =
    'relative h-[70%] w-auto max-w-[70%] -rotate-2 object-contain drop-shadow-2xl md:h-auto md:w-[85%] md:max-w-none md:max-h-[82%]'



  const iconoFallbackClase = 'relative h-20 w-20 text-brand-cream sm:h-32 sm:w-32'
  const tarjetaBlancaClase =
    'w-full min-w-0 rounded-[2rem] border-2 border-brand-dark bg-white p-5 text-brand-dark shadow-sticker sm:p-8'
  const badgeCategoriaClase =
    'inline-block rounded-full bg-brand-red px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white'
  const filaGrupoClase = 'flex items-center gap-3 border-b-2 border-dashed border-brand-sand py-4 last:border-b-0'
  const botonSeleccionarClase =
    'hidden shrink-0 rounded-full border-2 border-brand-dark px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream min-[325px]:inline-flex'
  const linkCambiarMovilChicoClase =
    'shrink-0 text-xs font-extrabold text-brand-red underline underline-offset-4 active:opacity-70 min-[325px]:hidden'

  const botonPrimarioStickerClase =
    'group flex min-h-11 sm:min-h-13 md:min-h-14 w-full min-w-0 items-center justify-center gap-2 rounded-full border-0 md:border-2 md:border-brand-dark bg-brand-red px-3.5 min-[360px]:px-5 md:px-6 py-0 md:py-4 font-extrabold text-white md:shadow-[4px_4px_0px_#252525] transition-all duration-200 md:hover:translate-y-0.5 md:hover:shadow-[2px_2px_0px_#252525] md:active:translate-y-1 md:active:shadow-none disabled:cursor-not-allowed disabled:opacity-40'
  const botonSecundarioBaseClase =
    'min-h-11 sm:min-h-13 shrink-0 rounded-full border-2 px-3.5 min-[360px]:px-4 sm:px-5 text-sm min-[360px]:text-base font-bold transition-colors'
  const botonContinuarClase =
    'flex min-h-11 sm:min-h-13 min-w-0 items-center justify-center gap-2 rounded-full bg-brand-red px-4 min-[360px]:px-5 sm:px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40'
  const footerMovilClase =
    'fixed bottom-0 left-0 right-0 z-40 rounded-t-[2rem] border-t-2 border-brand-dark bg-brand-dark px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_24px_rgba(26,20,20,0.28)] md:hidden'

  const botonBorde = (movil: boolean) =>
    movil
      ? 'border-brand-cream text-brand-cream hover:bg-brand-cream hover:text-brand-dark'
      : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-brand-cream'

  const totalTexto = (movil: boolean) => (
    <div className="text-right">
      <p className={`text-xs font-bold uppercase tracking-wider ${movil ? 'text-brand-cream/60' : 'text-brand-muted'}`}>
        Total
      </p>
      <p className={`font-display text-2xl sm:text-3xl font-extrabold ${movil ? 'text-brand-cream' : 'text-brand-dark'}`}>
        {precio(total)}
      </p>
    </div>
  )

  const barraCompra = (movil: boolean) =>
    !esUltimoPaso ? (
      <div className={movil ? 'flex flex-col gap-2.5' : 'flex items-center justify-between gap-3'}>
        {totalTexto(movil)}
        <div className={`flex gap-2 ${movil ? 'w-full' : ''}`}>
          <button
            type="button"
            onClick={() => (paso > 1 ? setPaso(paso - 1) : volverAlProducto())}
            className={`${botonSecundarioBaseClase} ${botonBorde(movil)}`}
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={() => irAPaso(paso + 1)}
            disabled={!puedeAvanzar}
            className={`${botonContinuarClase} ${movil ? 'flex-1' : ''}`}
          >
            Continuar <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    ) : (
      <div className={movil ? 'flex flex-col gap-2.5' : 'flex flex-col gap-4'}>
        <div className="flex items-center justify-between gap-4">
          <QuantityStepper value={cantidad} onChange={setCantidad} min={1} max={20} label={product.nombre} />
          {totalTexto(movil)}
        </div>

        <div className="flex items-center gap-2">
          {paso > 1 && (
            <button
              type="button"
              onClick={() => setPaso(paso - 1)}
              className={`${botonSecundarioBaseClase} ${botonBorde(movil)}`}
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={() => setConfirmandoAgregar(true)}
            disabled={!puedeComprar}
            className={`${botonPrimarioStickerClase} flex-1`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 min-[360px]:h-5 min-[360px]:w-5" />
            <span className="truncate text-sm min-[360px]:text-base sm:text-lg">Añadir al carrito</span>
            <ArrowRight className="hidden h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 min-[360px]:block" />
          </button>

        </div>
      </div>
    )

  const botonEmpezar = (
    <button
      type="button"
      onClick={empezarAArmar}
      disabled={!product.disponible || sucursalCerrada}
      className={botonPrimarioStickerClase}
    >
      <ShoppingBag className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 min-[360px]:h-5 min-[360px]:w-5" />
      <span className="truncate text-sm min-[360px]:text-base lg:text-lg">Agregar</span>
      <ArrowRight className="hidden h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 min-[360px]:block" />
    </button>
  )


  const infoProducto = (
    <>
      {categoryName && <span className={badgeCategoriaClase}>{categoryName}</span>}
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-none tracking-tight sm:text-5xl">
        {product.nombre}
      </h1>
      {descuentoSemana > 0 ? (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-extrabold text-brand-red">
            {precio(conDescuento(precioBase, descuentoSemana))}
          </span>
          <s className="font-bold text-brand-muted">{precio(precioBase)}</s>
          <span className="rounded-full bg-brand-red px-2.5 py-0.5 text-xs font-extrabold text-white">
            Producto de la semana · {Math.round(descuentoSemana * 100)}% OFF
          </span>
        </div>
      ) : (
        <p className="mt-3 text-2xl font-extrabold text-brand-red">{precio(precioBase)}</p>
      )}
      <p className="mt-3 w-full whitespace-normal break-words leading-relaxed text-brand-muted">
        {product.descripcion}
        {esCombo && <span className="block">{textoGruposCombo}</span>}
      </p>

      {!product.disponible && (
        <p className="mt-4 rounded-2xl border-2 border-dashed border-brand-red/40 bg-brand-red/5 px-4 py-3 font-bold text-brand-red">
          Este producto no está disponible por el momento.
        </p>
      )}

      {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} className="mt-4" />}
    </>
  )

  return (
    <div className="min-h-screen bg-brand-cream text-brand-dark">
      {/* Banda oscura superior */}
      <div className="bg-brand-dark px-4 pb-28 pt-6 sm:pb-40">
        <div className="mx-auto max-w-6xl">
          <Link
            to={`/catalogo?categoria=${product.categoriaId}`}
            className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-cream/70 transition-colors hover:text-brand-cream"
          >
            <ArrowLeft className="h-5 w-5" />
            Menú{categoryName && <span className="text-brand-cream/40">/ {categoryName}</span>}
          </Link>
        </div>
      </div>

      <div className={layoutGridClase}>
        {/* Imagen protagonista a la izquierda (en móvil se oculta mientras se arma el pedido) */}
        <div className={armando ? 'hidden lg:block' : ''}>
          <div className={marcoImagenClase}>
            <div className="absolute inset-[8%] rounded-full bg-black/15" />
            <ImagenProducto
              src={product.imagen}
              alt={product.nombre}
              className={`${imgProductoClase} ${product.disponible ? '' : 'opacity-60 grayscale'}`}
              claseIcono={iconoFallbackClase}
            />
          </div>
        </div>

        {/* Tarjeta blanca a la derecha: Presentación inicial o Pasos de armado */}
        <div className={tarjetaBlancaClase}>
          {!armando ? (
            <>
              {infoProducto}
              <div className="mt-8 hidden md:block">{botonEmpezar}</div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-brand-red">Armá tu pedido</p>
                  <h2 className="mt-1 font-display text-2xl font-extrabold leading-none tracking-tight sm:text-3xl">
                    {product.nombre}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={volverAlProducto}
                  className="shrink-0 text-sm font-bold text-brand-muted underline-offset-4 hover:text-brand-dark hover:underline"
                >
                  Cancelar
                </button>
              </div>

              {sucursalCerrada && <AvisoCierreSucursal sucursal={zona?.sucursalNombre} className="mt-5" />}

              {pasos.length > 1 && (
                <div className="mt-6">
                  <Stepper pasos={pasos.map((p) => p.nombre)} actual={paso} onIrA={irAPaso} />
                </div>
              )}

              {/* Paso 1: Ingredientes personalizables */}
              {pasoActual === 'ingredientes' && (
                <>
                  {esCombo && productoPrincipal && (
                    <div className="mt-5 flex items-center gap-3.5 rounded-2xl border-2 border-dashed border-brand-sand bg-brand-cream/50 p-3">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border-2 border-brand-dark bg-brand-red p-1.5">
                        <ImagenProducto
                          src={productoPrincipal.imagen}
                          alt={productoPrincipal.nombre}
                          className="h-full w-full object-contain drop-shadow"
                          claseIcono="h-7 w-7 text-brand-cream"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-red">
                          Personalizando
                        </p>
                        <p className="truncate font-display text-lg font-extrabold leading-tight">
                          {productoPrincipal.nombre}
                        </p>
                        <p className="text-xs text-brand-muted">
                          Los cambios aplican al producto principal del combo
                        </p>
                      </div>
                    </div>
                  )}

                  <IngredientesEditables
                    ingredientes={ingredientes}
                    cantidades={cantidades}
                    onCambiar={(insumoId, nuevaCantidad) => {
                      const ing = ingredientes.find((i) => i.insumoId === insumoId)
                      setCantidades((prev) => {
                        const nuevas = { ...prev }
                        if (ing && nuevaCantidad === ing.cantidadBase) delete nuevas[insumoId]
                        else nuevas[insumoId] = nuevaCantidad
                        return nuevas
                      })
                    }}
                  />
                </>
              )}


              {/* Paso 2: Tamaño y/o grupos del combo */}

              {pasoActual === 'opciones' && tamanios.length > 1 && (
                <SelectorTamanio
                  tamanios={tamanios}
                  valor={tamanioId}
                  onChange={cambiarTamanio}
                  conImagen={esCombo}

                />
              )}


              {pasoActual === 'opciones' && esCombo && (
                <section className="mt-6 border-t-2 border-dashed border-brand-sand pt-2" aria-label="Armá tu combo">
                  {grupos.map((grupo) => {
                    const elegido = elegida(grupo)
                    const textoAccion = elegido || sinOpcion(grupo) ? 'Cambiar' : 'Elegir'

                    return (
                      <div key={grupo.id} className={filaGrupoClase}>
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-lg font-extrabold">{grupo.nombre}</p>

                          <div className="mt-0.5 flex items-baseline justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {sinOpcion(grupo) ? (
                                <p className="truncate text-sm text-brand-muted">{textoSin(grupo)}</p>
                              ) : elegido ? (
                                <p className="truncate text-sm text-brand-muted">
                                  {elegido.nombre}
                                  {elegido.recargo > 0 && <> · +{precio(elegido.recargo)}</>}
                                </p>
                              ) : (
                                <p
                                  className={`truncate text-sm font-semibold ${grupo.obligatorio ? 'text-brand-red' : 'text-brand-muted'}`}
                                >
                                  Elegí uno {grupo.obligatorio ? '(obligatorio)' : '(opcional)'}
                                </p>
                              )}
                            </div>

                            {/* <= 324px: Texto simple "Cambiar" / "Elegir" a la derecha de lo seleccionado */}
                            <button
                              type="button"
                              onClick={() => setGrupoAbierto(grupo.id)}
                              className={linkCambiarMovilChicoClase}
                            >
                              {textoAccion}
                            </button>
                          </div>
                        </div>

                        {/* >= 325px: Botón píldora estándar */}
                        <button
                          type="button"
                          onClick={() => setGrupoAbierto(grupo.id)}
                          className={botonSeleccionarClase}
                        >
                          {textoAccion}
                        </button>
                      </div>
                    )
                  })}
                </section>
              )}


              {/* Paso 3: Resumen de lo elegido */}
              {pasoActual === 'final' && (
                <>
                  <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-sand bg-brand-cream/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Tu elección</p>
                    <p className="mt-1 font-semibold">{resumenEleccion() || 'Como viene en la receta'}</p>
                  </div>

                  {/* En móvil: muestra la imagen del producto debajo del resumen */}
                  <div className="mt-6 lg:hidden">
                    <div className="relative mx-auto grid aspect-square w-full max-w-[220px] rotate-2 place-items-center rounded-[1.75rem] border-2 border-brand-dark bg-brand-red">
                      <div className="absolute inset-[8%] rounded-full bg-black/15" />
                      <ImagenProducto
                        src={product.imagen}
                        alt={product.nombre}
                        className={`relative h-[72%] w-auto max-w-[72%] -rotate-2 object-contain drop-shadow-xl ${product.disponible ? '' : 'opacity-60 grayscale'
                          }`}
                        claseIcono="relative h-16 w-16 text-brand-cream"
                      />
                    </div>
                  </div>
                </>
              )}


              {/* En desktop la barra de compra va dentro de la tarjeta */}
              <div className="mt-8 hidden border-t-2 border-dashed border-brand-sand pt-6 md:block">
                {barraCompra(false)}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer fijo en móvil */}
      <div className={footerMovilClase}>
        {armando ? (
          barraCompra(true)
        ) : (
          <div className="flex items-center justify-between gap-2.5 min-[360px]:gap-4">
            {totalTexto(true)}
            <div className="min-w-0 flex-1">{botonEmpezar}</div>
          </div>
        )}
      </div>

      <ModalConfirmarAgregar
        abierto={confirmandoAgregar}
        nombre={product.nombre}
        imagen={product.imagen}
        detalle={resumenEleccion()}
        cantidad={cantidad}
        total={total}
        deshabilitado={sucursalCerrada}
        sucursal={zona?.sucursalNombre}
        onCambiarDireccion={() => {
          setConfirmandoAgregar(false)
          abrirSelector()
        }}
        onCancelar={() => setConfirmandoAgregar(false)}
        onConfirmar={() => {
          setConfirmandoAgregar(false)
          anadirAlCarrito()
        }}
      />

      {grupoActivo && (
        <ChoiceSheet
          title={grupoActivo.nombre}
          opciones={opciones[grupoActivo.id] ?? []}
          seleccionadoId={eleccionDe(grupoActivo) ?? null}
          textoSin={grupoActivo.obligatorio ? undefined : textoSin(grupoActivo)}
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
