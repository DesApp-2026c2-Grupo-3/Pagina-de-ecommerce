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
  // Paso actual de la tarjeta (empieza en 1, como el Stepper)
  const [paso, setPaso] = useState(1)
  // Pregunta "¿Lo sumamos al carrito?" antes de agregarlo
  const [confirmandoAgregar, setConfirmandoAgregar] = useState(false)

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
      })
      .finally(() => setLoading(false))
  }, [id, zona?.sucursalId])

  const nombreCategoria = (categoriaId?: number | null) => categorias.find((c) => c.id === categoriaId)?.nombre ?? ''

  const categoryName = nombreCategoria(product?.categoriaId)
  // Un combo es un producto con grupos elegibles (acompañamiento, bebida, ...) cargados en la base
  const grupos = useMemo(() => [...(product?.grupos ?? [])].sort((a, b) => a.orden - b.orden), [product])
  const esCombo = grupos.length > 0
  const tamanios = useMemo(() => ordenarTamanios(product?.tamanios), [product])
  const tamanioActivo = tamanios.find((t) => t.tamanioId === tamanioId) ?? null
  // "Acompañamiento y una bebida regular a elección." / "Café y para comer a elección."
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
  // Si el cliente no tocó un lugar, va la opción incluida. SIN_OPCION = lo pidió sin eso (mismo precio).
  const eleccionDe = (grupo: ComboGrupo) => eleccion[grupo.id] ?? eleccionPorDefecto(grupo, opciones[grupo.id] ?? [])
  const sinOpcion = (grupo: ComboGrupo) => eleccionDe(grupo) === SIN_OPCION
  const elegida = (grupo: ComboGrupo) => opciones[grupo.id]?.find((o) => o.id === eleccionDe(grupo)) ?? null

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
  // Producto de la semana: el descuento se aplica sobre todo (igual que el backend)
  const semana = promos?.productoSemana
  const descuentoSemana = semana?.items.find((i) => i.productoId === product?.id)?.descuento ?? 0
  const precioLista = precioBase + precioExtras + recargoCombo
  const precioUnitario = descuentoSemana > 0 ? conDescuento(precioLista, descuentoSemana) : precioLista
  const total = precioUnitario * cantidad

  const comboCompleto = grupos.every((g) => !g.obligatorio || elegida(g) !== null)
  const grupoActivo = grupos.find((g) => g.id === grupoAbierto) ?? null
  const puedeAgregar = !!product?.disponible && comboCompleto
  const puedeComprar = puedeAgregar && !sucursalCerrada

  // Pasos de la tarjeta: solo los que aplican a este producto. El último siempre es el resumen y la compra.
  const pasos = [
    // 1. Sacar o sumar ingredientes (en un combo, los del producto principal)
    ...(personalizable ? [{ id: 'ingredientes', nombre: 'Ingredientes' }] : []),
    // 2. Tamaño y, si es combo, acompañamiento y bebida. Con un único tamaño y sin combo, no hay nada que elegir
    ...(esCombo || tamanios.length > 1 ? [{ id: 'opciones', nombre: esCombo ? 'Tu combo' : 'Tamaño' }] : []),
    // 3. Repaso, cantidad y añadir al carrito
    { id: 'final', nombre: 'Resumen' },
  ]
  const pasoActual = pasos[paso - 1]?.id ?? 'final'
  const esUltimoPaso = paso >= pasos.length
  // No se avanza del paso del combo sin elegir lo obligatorio
  const puedeAvanzar = pasoActual !== 'opciones' || comboCompleto

  function irAPaso(destino: number) {
    // Para pasar más allá del combo, tiene que estar completo
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

  // "Mediana · Coca Cola · Sin cebolla": lo elegido en los pasos, para el repaso y la confirmación
  function resumenEleccion() {
    return [
      tamanioActivo ? etiquetaTamanio(tamanioActivo.tamanio) : '',
      ...grupos.map((g) => (sinOpcion(g) ? textoSin(g) : (elegida(g)?.nombre ?? ''))),
      ...textoPersonalizacion(),
    ]
      .filter(Boolean)
      .join(' · ')
  }

  // Lo que eligió el cliente, listo para el carrito o para una compra directa
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
    showToast(`${product.nombre} agregado al carrito`)
    // Después de confirmar, vuelve al menú en la categoría del producto (Combos › Carne, por ejemplo)
    navigate(`/catalogo?categoria=${product.categoriaId}`)
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

  const filaGrupo = 'flex items-center gap-3 border-b-2 border-dashed border-brand-sand py-4 last:border-b-0'
  const botonSeleccionar =
    'shrink-0 rounded-full border-2 border-brand-dark px-4 py-2 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark hover:text-brand-cream'

  const totalTexto = (movil: boolean) => (
    <div className="text-right">
      <p className={`text-xs font-bold uppercase tracking-wider ${movil ? 'text-brand-cream/60' : 'text-brand-muted'}`}>
        Total
      </p>
      <p className={`font-display text-3xl font-extrabold ${movil ? 'text-brand-cream' : 'text-brand-dark'}`}>
        {precio(total)}
      </p>
    </div>
  )

  const botonBorde = (movil: boolean) =>
    movil
      ? 'border-brand-cream text-brand-cream hover:bg-brand-cream hover:text-brand-dark'
      : 'border-brand-dark text-brand-dark hover:bg-brand-dark hover:text-brand-cream'

  // Pasos intermedios: total + Atrás / Continuar.
  // Último paso: cantidad, total y los dos botones de compra. En el celular la barra es oscura y va pegada abajo.
  const barraCompra = (movil: boolean) =>
    !esUltimoPaso ? (
      <div className={movil ? 'flex flex-col gap-3' : 'flex items-center justify-between gap-3'}>
        {totalTexto(movil)}
        <div className={`flex gap-2 ${movil ? 'w-full' : ''}`}>
          {paso > 1 && (
            <button
              type="button"
              onClick={() => setPaso(paso - 1)}
              className={`min-h-13 rounded-full border-2 px-5 font-bold ${botonBorde(movil)}`}
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={() => irAPaso(paso + 1)}
            disabled={!puedeAvanzar}
            className={`flex min-h-13 items-center justify-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 ${movil ? 'flex-1' : ''}`}
          >
            Continuar <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="flex items-center justify-between gap-4 pb-4">
          <QuantityStepper value={cantidad} onChange={setCantidad} min={1} max={20} label={product.nombre} />
          {totalTexto(movil)}
        </div>
        
    
          <button
            type="button"
            onClick={() => setConfirmandoAgregar(true)}
            disabled={!puedeComprar}
            className="group flex min-h-14 w-full items-center justify-center gap-3
            rounded-full border-2 border-brand-dark bg-brand-red
            px-6 py-4 font-extrabold text-white
            shadow-[4px_4px_0px_#252525] transition-all duration-200
            hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#252525]
            active:translate-y-1 active:shadow-none
            disabled:cursor-not-allowed disabled:opacity-40">
            <ShoppingBag className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"/>
            <span className="text-base sm:text-lg">Añadir al carrito</span>
            <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        
        {paso > 1 && (
          <button
            type="button"
            onClick={() => setPaso(paso - 1)}
            className={`group mt-3 flex w-full items-center justify-center gap-2
              rounded-full py-2.5 text-sm font-bold
              transition-all duration-200
              hover:bg-brand-dark/5 ${movil ? 'text-brand-cream/80' : 'text-brand-muted'}`}
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            <span>Volver al paso anterior</span>
          </button>
        )}
      </>
    )

  const imagenProducto = (claseImg: string, claseIcono: string) => (
    <ImagenProducto
      src={product.imagen}
      alt={product.nombre}
      className={`${claseImg} ${product.disponible ? '' : 'opacity-60 grayscale'}`}
      claseIcono={claseIcono}
    />
  )

  // Nombre, precio y descripción (van en la tarjeta de la izquierda, debajo de la imagen)
  const infoProducto = (
    <>
      <h1 className="mt-0 font-display text-4xl font-extrabold leading-none tracking-tight sm:text-5xl">
        {product.nombre}
      </h1>
      {descuentoSemana > 0 ? (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-2xl font-extrabold text-brand-red">{precio(conDescuento(precioBase, descuentoSemana))}</span>
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
      {/* Banda oscura arriba: las tarjetas se montan sobre ella */}
      <div className="bg-brand-dark px-4 pb-40 pt-6">
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

      <div className="mx-auto -mt-36 grid max-w-6xl gap-8 px-4 pb-12 md:grid-cols-2 md:items-start md:gap-12 [&>*]:min-w-0">
        {/* A la izquierda: una sola tarjeta con la categoría, la imagen chica y la descripción */}
        <div className="rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker sm:p-8">
          {categoryName && (
            <span className="mb-4 inline-block rounded-full bg-brand-red px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
              {categoryName}
            </span>
          )}
          <div className="relative mx-auto mb-6 grid aspect-square w-full max-w-[13rem] rotate-2 place-items-center rounded-[1.75rem] border-2 border-brand-dark bg-brand-red">
            <div className="absolute inset-[8%] rounded-full bg-black/15" />
            {imagenProducto('relative w-[85%] -rotate-2 object-contain drop-shadow-xl', 'relative h-16 w-16 text-brand-cream')}
          </div>
          {infoProducto}
        </div>

        {/* A la derecha: los pasos para armar el pedido, desde el principio */}
        <div className="rounded-[2rem] border-2 border-brand-dark bg-white p-6 shadow-sticker sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-wider text-brand-red">Armá tu pedido</p>

          {pasos.length > 1 && (
            <div className="mt-6">
              <Stepper pasos={pasos.map((p) => p.nombre)} actual={paso} onIrA={irAPaso} />
            </div>
          )}

          {/* Paso 1: sacar y sumar ingredientes (en un combo, los del producto principal) */}
          {pasoActual === 'ingredientes' && (
            <IngredientesEditables
              ingredientes={ingredientes}
              cantidades={cantidades}
              onCambiar={(insumoId, cantidad) => {
                const ing = ingredientes.find((i) => i.insumoId === insumoId)
                setCantidades((prev) => {
                  const nuevas = { ...prev }
                  // Si vuelve a la cantidad de la receta, deja de contar como cambio
                  if (ing && cantidad === ing.cantidadBase) delete nuevas[insumoId]
                  else nuevas[insumoId] = cantidad
                  return nuevas
                })
              }}
            />
          )}

          {/* Paso 2: los tamaños en fila y, si es combo, debajo el acompañamiento y la bebida */}
          {pasoActual === 'opciones' && tamanios.length > 1 && (
            <SelectorTamanio tamanios={tamanios} valor={tamanioId} onChange={cambiarTamanio} />
          )}

          {pasoActual === 'opciones' && esCombo && (
            <section className="mt-6 border-t-2 border-dashed border-brand-sand pt-2" aria-label="Armá tu combo">
              {grupos.map((grupo) => {
                const elegido = elegida(grupo)
                return (
                  <div key={grupo.id} className={filaGrupo}>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-extrabold">{grupo.nombre}</p>
                      {sinOpcion(grupo) ? (
                        <p className="text-sm text-brand-muted">{textoSin(grupo)}</p>
                      ) : elegido ? (
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
                      {elegido || sinOpcion(grupo) ? 'Cambiar' : 'Elegir'}
                    </button>
                  </div>
                )
              })}
            </section>
          )}

          {/* Paso 3: repaso de lo elegido (la cantidad y el botón van en la barra de compra) */}
          {pasoActual === 'final' && pasos.length > 1 && (
            <div className="mt-6 rounded-2xl border-2 border-dashed border-brand-sand bg-brand-cream/60 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Tu elección</p>
              <p className="mt-1 font-semibold">{resumenEleccion() || 'Como viene en la receta'}</p>
            </div>
          )}

          {/* En pantallas grandes la barra de compra va dentro de la tarjeta */}
          <div className="mt-8 hidden border-t-2 border-dashed border-brand-sand pt-6 md:block">
            {barraCompra(false)}
          </div>
        </div>
      </div>

      {/* En el celular la barra queda pegada al pie de la pantalla */}
      <div className="sticky bottom-0 z-30 rounded-t-[2rem] bg-brand-dark px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_-8px_24px_rgba(26,20,20,0.25)] md:hidden">
        {barraCompra(true)}
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