import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Modal from './Modal'
import Stepper from './Stepper'
import ChoiceSheet, { type OpcionElegible } from './product/ChoiceSheet'
import IngredientesEditables from './product/IngredientesEditables'
import SelectorTamanio from './product/SelectorTamanio'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'
import { getProductoDetalle, getProducts } from '../services/productService'
import { ordenarTamanios } from '../config/combo'
import { formatearPrecio } from '../utils/precio'
import { SIN_OPCION, opcionesDeGrupo, textoSin } from '../utils/comboOpciones'
import { conDescuento } from '../utils/promosUtils'
import type { CartItem } from '../types/cart'
import type { ComboGrupo, ProductIngredient, ProductoBackend } from '../types/product'

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

// Textos que no se tocan al editar (la promo de origen, una nota)
const esTextoFijo = (texto: string) => texto.startsWith('Promo:') || texto.startsWith('Nota:')

interface EditarItemModalProps {
  item: CartItem | null // null = cerrado
  onClose: () => void
}

// Editar un producto del carrito, en pasos (como al armarlo): tamaño → combo → ingredientes.
// Solo aparecen los pasos que aplican; así el modal no se hace largo.
function EditarItemModal({ item, onClose }: EditarItemModalProps) {
  const { reemplazarItem } = useCart()
  const { zona } = useZona()
  const [producto, setProducto] = useState<ProductoBackend | null>(null)
  const [catalogo, setCatalogo] = useState<ProductoBackend[]>([])
  const [tamanioId, setTamanioId] = useState<number | null>(null)
  const [cantidades, setCantidades] = useState<Cantidades>({})
  // grupoId -> productoId elegido (SIN_OPCION = sin ese lugar)
  const [eleccion, setEleccion] = useState<Record<number, number>>({})
  const [grupoAbierto, setGrupoAbierto] = useState<number | null>(null)
  const [paso, setPaso] = useState(1)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Al abrir, trae el producto actualizado y carga lo que ya estaba elegido
  useEffect(() => {
    if (!item) return
    setCargando(true)
    setError('')
    setProducto(null)
    setGrupoAbierto(null)
    setPaso(1)

    const esCombo = Boolean(item.product.grupos?.length || item.combo)
    Promise.all([
      getProductoDetalle(item.product.id, zona?.sucursalId),
      esCombo ? getProducts(zona?.sucursalId) : Promise.resolve([]),
    ])
      .then(([p, productos]) => {
        setProducto(p)
        setCatalogo(productos)
        setTamanioId(item.tamanioId ?? ordenarTamanios(p.tamanios)[0]?.tamanioId ?? null)
        setCantidades(cantidadesDe(item))
        // Un lugar que no vino en el carrito se pidió "sin" eso
        const elegidos = new Map((item.combo ?? []).map((c) => [c.grupoId, c.productoId]))
        setEleccion(Object.fromEntries((p.grupos ?? []).map((g) => [g.id, elegidos.get(g.id) ?? SIN_OPCION])))
      })
      .catch(() => setError('No pudimos cargar el producto. Probá de nuevo.'))
      .finally(() => setCargando(false))
  }, [item, zona?.sucursalId])

  const ingredientes = producto?.ingredientes ?? []
  const tamanios = useMemo(() => ordenarTamanios(producto?.tamanios), [producto])
  const grupos = useMemo(() => [...(producto?.grupos ?? [])].sort((a, b) => a.orden - b.orden), [producto])
  const esCombo = grupos.length > 0

  const opciones: Record<number, OpcionElegible[]> = Object.fromEntries(
    grupos.map((g) => [g.id, opcionesDeGrupo(g, catalogo, tamanioId)]),
  )
  const elegida = (g: ComboGrupo) => opciones[g.id]?.find((o) => o.id === eleccion[g.id]) ?? null
  const sinOpcion = (g: ComboGrupo) => eleccion[g.id] === SIN_OPCION

  const precioBase = (() => {
    const t = tamanios.find((x) => x.tamanioId === tamanioId)
    return t ? Number(t.precio) : Number(producto?.precio ?? 0)
  })()
  const recargoCombo = grupos.reduce((suma, g) => suma + (elegida(g)?.recargo ?? 0), 0)
  // Si vino de una promo, conserva su descuento (sobre el precio nuevo)
  const precioLista = precioBase + precioExtras(ingredientes, cantidades) + recargoCombo
  const unitPrice = item?.descuento ? conDescuento(precioLista, item.descuento) : precioLista

  // Un lugar obligatorio sin opción válida (por ejemplo, después de cambiar el tamaño) no deja guardar
  const comboCompleto = grupos.every((g) => !g.obligatorio || elegida(g) !== null)
  const grupoActivo = grupos.find((g) => g.id === grupoAbierto) ?? null

  const pasos = [
    ...(tamanios.length > 1 ? [{ id: 'tamanio', nombre: 'Tamaño' }] : []),
    ...(esCombo ? [{ id: 'combo', nombre: 'Tu combo' }] : []),
    ...(ingredientes.some((i) => i.esRemovible || i.esAgregable) ? [{ id: 'ingredientes', nombre: 'Ingredientes' }] : []),
  ]
  const pasoActual = pasos[paso - 1]?.id
  const esUltimoPaso = paso >= pasos.length
  // No se pasa del combo sin elegir lo obligatorio
  const puedeAvanzar = pasoActual !== 'combo' || comboCompleto

  function irAPaso(destino: number) {
    const pasoCombo = pasos.findIndex((x) => x.id === 'combo') + 1
    setPaso(pasoCombo > 0 && destino > pasoCombo && !comboCompleto ? pasoCombo : destino)
  }

  function cambiarTamanio(nuevo: number) {
    setTamanioId(nuevo)
    // Si lo elegido no existe en el tamaño nuevo, se vuelve a la opción incluida
    setEleccion((prev) =>
      Object.fromEntries(
        grupos.map((g) => {
          const actual = prev[g.id]
          const sigue = actual === SIN_OPCION || opcionesDeGrupo(g, catalogo, nuevo).some((o) => o.id === actual)
          return [g.id, sigue ? actual : g.productoIncluidoId]
        }),
      ),
    )
  }

  function guardar() {
    if (!item || !producto || !comboCompleto) return

    const textosCombo = grupos.map((g) => {
      if (sinOpcion(g)) return textoSin(g)
      const o = elegida(g)
      return o ? `${o.nombre}${o.recargo > 0 ? ` (+${formatearPrecio(o.recargo)})` : ''}` : ''
    })
    const fijos = item.selectedOptions.filter(esTextoFijo)

    reemplazarItem(item.id, producto, [...textosCombo, ...textosDe(ingredientes, cantidades), ...fijos].filter(Boolean), {
      unitPrice,
      personalizaciones: Object.entries(cantidades).map(([insumoId, cantidad]) => ({
        insumoId: Number(insumoId),
        cantidad,
      })),
      tamanioId,
      ...(item.promoId
        ? { promoId: item.promoId, descuento: item.descuento, precioLista, promoFija: item.promoFija }
        : {}),
      combo: esCombo
        ? grupos.filter((g) => elegida(g) !== null).map((g) => ({ grupoId: g.id, productoId: elegida(g)!.id }))
        : undefined,
    })
    onClose()
  }

  const fila = 'flex items-center gap-3 border-b-2 border-dashed border-brand-sand py-3 last:border-b-0'
  const botonChico =
    'shrink-0 rounded-full border-2 border-brand-dark px-4 py-1.5 text-sm font-bold text-brand-dark hover:bg-brand-dark hover:text-brand-cream'

  return (
    <Modal
      isOpen={item !== null}
      onClose={onClose}
      title={item ? `Editar ${item.product.nombre}` : 'Editar'}
      tamanio="lg"
    >
      {cargando ? (
        <p className="text-sm text-brand-muted">Cargando...</p>
      ) : error ? (
        <p className="text-sm font-semibold text-brand-red">{error}</p>
      ) : (
        producto &&
        item && (
          <div className="flex flex-col gap-5">
            {pasos.length > 1 && <Stepper pasos={pasos.map((x) => x.nombre)} actual={paso} onIrA={irAPaso} />}

            {pasoActual === 'tamanio' && <SelectorTamanio tamanios={tamanios} valor={tamanioId} onChange={cambiarTamanio} />}

            {/* Lugares del combo: papas, bebida... (se pueden pedir "sin", al mismo precio) */}
            {pasoActual === 'combo' && (
              <section aria-label="Tu combo" className="rounded-2xl border-2 border-brand-dark bg-white px-4">
                {grupos.map((g) => {
                  const o = elegida(g)
                  return (
                    <div key={g.id} className={fila}>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold">{g.nombre}</p>
                        <p className="text-sm text-brand-muted">
                          {sinOpcion(g) ? textoSin(g) : o ? `${o.nombre}${o.recargo > 0 ? ` · +${formatearPrecio(o.recargo)}` : ''}` : 'Elegí uno'}
                        </p>
                      </div>
                      <button type="button" onClick={() => setGrupoAbierto(g.id)} className={botonChico}>
                        Cambiar
                      </button>
                    </div>
                  )
                })}
              </section>
            )}

            {/* Los mismos checkboxes que al armarlo: Sacale / Sumale */}
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

            {!producto.disponible && (
              <p className="text-sm font-semibold text-brand-red">Este producto ya no está disponible.</p>
            )}

            <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-brand-sand pt-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  {item.quantity > 1 ? `${item.quantity} × ${formatearPrecio(unitPrice)}` : 'Total'}
                </p>
                <p className="font-display text-3xl font-extrabold">{formatearPrecio(unitPrice * item.quantity)}</p>
              </div>
              <div className="flex gap-2">
                {paso > 1 && (
                  <button
                    type="button"
                    onClick={() => setPaso(paso - 1)}
                    className="min-h-12 rounded-full border-2 border-brand-dark px-5 font-bold text-brand-dark hover:bg-brand-dark hover:text-brand-cream"
                  >
                    Atrás
                  </button>
                )}
                {esUltimoPaso ? (
                  <button
                    type="button"
                    onClick={guardar}
                    disabled={!producto.disponible || !comboCompleto}
                    className="min-h-12 rounded-full bg-brand-red px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Guardar cambios
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => irAPaso(paso + 1)}
                    disabled={!puedeAvanzar}
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-red px-6 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continuar <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {grupoActivo && (
              <ChoiceSheet
                title={grupoActivo.nombre}
                opciones={opciones[grupoActivo.id] ?? []}
                seleccionadoId={eleccion[grupoActivo.id] ?? null}
                textoSin={grupoActivo.obligatorio ? undefined : textoSin(grupoActivo)}
                onClose={() => setGrupoAbierto(null)}
                onElegir={(id) => {
                  setEleccion((prev) => ({ ...prev, [grupoActivo.id]: id }))
                  setGrupoAbierto(null)
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
