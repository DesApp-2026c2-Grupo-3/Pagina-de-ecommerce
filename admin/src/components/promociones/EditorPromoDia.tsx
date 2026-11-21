// Editor de una promo del día (bloque 4). Se abre dentro de la tarjeta de la semana:
// se elige la mecánica, los productos y los días, y se ve la tarjeta como la ve el cliente.
import { useState } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import type { PromocionAdmin } from '../../types/promocion.types'
import { DIAS } from '../../config/promociones'
import {
  MECANICAS, OFERTAS, aItems, circulo, desdePromo, detalleSugerido, mecanicaVacia, precios, tituloSugerido, validarMecanica,
  type ErroresMecanica, type MecanicaPromo, type Oferta, type ProductoOpcion,
} from '../../utils/mecanicasPromo'
import { pedidoDesdePromo } from '../../utils/promoAPedido'
import {
  actualizarPromocion, crearPromocion, deshabilitarPromocion, eliminarPromocion,
} from '../../services/promocionService'
import ConfirmarEliminacion from '../ConfirmarEliminacion'
import {
  Acciones, Cantidad, EditorConVista, ErrorCampo, ErrorGeneral, MARCA, SelectProducto,
  ayuda, botonSecundario, campo, chip, etiqueta, formatearPrecio,
} from './comun'

const nombreDia = (dia: number) => DIAS.find((d) => d.valor === dia)?.nombre ?? ''

interface Props {
  /** La promo que se edita (null = nueva) */
  promo: PromocionAdmin | null
  /** Día desde el que se abrió (en una nueva, queda marcado) */
  diaInicial: number
  /** Nueva promo con un producto ya elegido (viene del reporte de menos vendidos) */
  productoInicial?: number | null
  /** Las promos del día que están activas (para saber qué días están completos) */
  activas: PromocionAdmin[]
  productos: ProductoOpcion[]
  maxPorDia: number
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

export default function EditorPromoDia({ promo, diaInicial, productoInicial = null, activas, productos, maxPorDia, onCerrar, onGuardado }: Props) {
  const inicial = promo ? desdePromo(promo) : { mecanica: { ...mecanicaVacia(), productoId: productoInicial }, aproximada: false }
  const [m, setM] = useState<MecanicaPromo>(inicial.mecanica)
  const [dias, setDias] = useState<number[]>(promo ? promo.dias : [diaInicial])
  const [titulo, setTitulo] = useState(promo?.titulo ?? '')
  const [tituloTocado, setTituloTocado] = useState(Boolean(promo) && promo?.titulo !== tituloSugerido(inicial.mecanica, productos))
  // Día completo → qué promo se saca de ese día para hacerle lugar
  const [saca, setSaca] = useState<Record<number, number>>({})
  const [errores, setErrores] = useState<ErroresMecanica>({})
  const [errorDias, setErrorDias] = useState('')
  const [errorSaca, setErrorSaca] = useState<Record<number, string>>({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState(false)

  const otrasDelDia = (dia: number) => activas.filter((p) => p.id !== promo?.id && p.dias.includes(dia))
  const lleno = (dia: number) => otrasDelDia(dia).length >= maxPorDia

  const tituloMostrado = tituloTocado ? titulo : tituloSugerido(m, productos)
  const p = precios(m, productos)
  const circ = circulo(m, productos)
  const tieneEliminados = promo?.items.some((i) => i.eliminado)

  function cambiar(cambios: Partial<MecanicaPromo>) {
    setM((prev) => ({ ...prev, ...cambios }))
    setErrores({})
    setError('')
  }

  function alternarDia(dia: number) {
    setDias((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]))
    setErrorDias('')
  }

  async function guardar() {
    const nuevos = validarMecanica(m, productos)
    const faltaSacar: Record<number, string> = {}
    for (const dia of dias) {
      if (lleno(dia) && saca[dia] === undefined) faltaSacar[dia] = 'Elegí cuál sacar para hacerle lugar'
    }
    setErrores(nuevos)
    setErrorSaca(faltaSacar)
    setErrorDias(dias.length === 0 ? 'Elegí al menos un día' : '')
    const items = aItems(m, productos)
    if (Object.keys(nuevos).length || Object.keys(faltaSacar).length || dias.length === 0 || !items) return

    setGuardando(true)
    setError('')
    try {
      // 1) Hacer lugar en los días completos: la promo elegida deja de estar ese día
      //    (si se queda sin días, se pausa: sigue guardada para usarla otra vez)
      const quitar = new Map<number, number[]>()
      for (const dia of dias) {
        const id = saca[dia]
        if (id !== undefined && lleno(dia)) quitar.set(id, [...(quitar.get(id) ?? []), dia])
      }
      const sacadas: string[] = []
      for (const [id, diasQuitar] of quitar) {
        const otra = activas.find((x) => x.id === id)
        if (!otra) continue
        const quedan = otra.dias.filter((d) => !diasQuitar.includes(d))
        if (quedan.length === 0) await deshabilitarPromocion(id)
        else await actualizarPromocion(id, pedidoDesdePromo(otra, { dias: quedan }))
        sacadas.push(`"${otra.titulo}"`)
      }

      // 2) Guardar esta promo
      const datos = {
        tipo: 'DIA',
        titulo: (tituloMostrado.trim() || tituloSugerido(m, productos) || 'Promo del día').slice(0, 60),
        destacado: circ,
        detalle: detalleSugerido(m, productos),
        dias: [...dias].sort((a, b) => a - b),
        maxPorPedido: promo?.maxPorPedido ?? 1,
        compraMinima: promo?.compraMinima ?? null,
        activo: true,
        items,
      }
      if (promo) await actualizarPromocion(promo.id, datos)
      else await crearPromocion(datos)

      const base = promo ? (promo.activo ? 'Promo actualizada' : 'Promo activada') : 'Promo agregada'
      onGuardado(sacadas.length ? `${base}. Se sacó ${sacadas.join(' y ')} para hacerle lugar.` : base)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la promo.')
    } finally {
      setGuardando(false)
    }
  }

  async function pausar() {
    if (!promo) return
    setGuardando(true)
    try {
      await deshabilitarPromocion(promo.id)
      onGuardado('Promo pausada. La encontrás abajo, en «Pausadas».')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo pausar la promo.')
    } finally {
      setGuardando(false)
    }
  }

  async function eliminar() {
    if (!promo) return
    setConfirmarEliminar(false)
    setGuardando(true)
    try {
      await eliminarPromocion(promo.id)
      onGuardado('Promo eliminada')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la promo.')
      setGuardando(false)
    }
  }

  // ---------- Campos de cada mecánica ----------
  const selectEnFila = `${campo} min-w-0 flex-1`

  function camposPorcentaje(atajos: { valor: number; texto: string }[], id: string, max: number) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {atajos.map((a) => (
          <button key={a.valor} type="button" className={chip(m.porcentaje === a.valor)} onClick={() => cambiar({ porcentaje: a.valor })}>
            {a.texto}
          </button>
        ))}
        <span className="flex items-center gap-1">
          <input
            id={id}
            type="number"
            min={1}
            max={max}
            value={m.porcentaje || ''}
            onChange={(e) => cambiar({ porcentaje: Number(e.target.value) || 0 })}
            className={`${campo} w-20`}
          />
          %
        </span>
      </div>
    )
  }

  let campos = null
  if (m.tipo === 'descuento') {
    campos = (
      <>
        <div>
          <label htmlFor="dia-producto" className={etiqueta}>Producto</label>
          <div className="flex items-center gap-2">
            <SelectProducto id="dia-producto" productos={productos} valor={m.productoId} onChange={(id) => cambiar({ productoId: id })} className={selectEnFila} />
            <Cantidad valor={m.cantidad} onChange={(n) => cambiar({ cantidad: n })} etiquetaAccesible="Cantidad" />
          </div>
          <ErrorCampo mensaje={errores.producto} />
        </div>
        <div>
          <label htmlFor="dia-porcentaje" className={etiqueta}>Descuento</label>
          {camposPorcentaje([10, 20, 30, 50].map((v) => ({ valor: v, texto: `${v}%` })), 'dia-porcentaje', 90)}
          <ErrorCampo mensaje={errores.porcentaje} />
        </div>
      </>
    )
  }
  if (m.tipo === 'llevaMas') {
    const o = OFERTAS[m.oferta]
    campos = (
      <>
        <div>
          <label htmlFor="dia-producto" className={etiqueta}>Producto</label>
          <SelectProducto id="dia-producto" productos={productos} valor={m.productoId} onChange={(id) => cambiar({ productoId: id })} />
          <ErrorCampo mensaje={errores.producto} />
        </div>
        <div>
          <span className={etiqueta}>Oferta</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(OFERTAS) as Oferta[]).map((k) => (
              <button key={k} type="button" className={chip(m.oferta === k)} onClick={() => cambiar({ oferta: k })}>
                {OFERTAS[k].etiqueta}
              </button>
            ))}
          </div>
          <p className={ayuda}>
            {m.oferta.startsWith('2da') ? 'Lleva 2 unidades: la segunda con descuento.' : `Lleva ${o.unidades} y paga ${o.paga}.`}
          </p>
        </div>
      </>
    )
  }
  if (m.tipo === 'conOtro') {
    campos = (
      <>
        <div>
          <label htmlFor="dia-producto" className={etiqueta}>El cliente compra</label>
          <div className="flex items-center gap-2">
            <SelectProducto id="dia-producto" productos={productos} valor={m.productoId} onChange={(id) => cambiar({ productoId: id })} className={selectEnFila} />
            <Cantidad valor={m.cantidad} onChange={(n) => cambiar({ cantidad: n })} etiquetaAccesible="Cantidad que compra" />
          </div>
          <ErrorCampo mensaje={errores.producto} />
        </div>
        <div>
          <label htmlFor="dia-otro" className={etiqueta}>Y se lleva</label>
          <div className="flex items-center gap-2">
            <SelectProducto id="dia-otro" productos={productos} valor={m.otroId} onChange={(id) => cambiar({ otroId: id })} className={selectEnFila} />
            <Cantidad valor={m.otroCantidad} onChange={(n) => cambiar({ otroCantidad: n })} etiquetaAccesible="Cantidad que se lleva" />
          </div>
          <ErrorCampo mensaje={errores.otro} />
        </div>
        <div>
          <label htmlFor="dia-porcentaje" className={etiqueta}>¿Cuánto paga por lo que se lleva?</label>
          {camposPorcentaje([{ valor: 100, texto: 'Gratis' }, { valor: 50, texto: '50% off' }, { valor: 30, texto: '30% off' }], 'dia-porcentaje', 100)}
          <p className={ayuda}>100 % = de regalo.</p>
          <ErrorCampo mensaje={errores.porcentaje} />
        </div>
      </>
    )
  }
  if (m.tipo === 'combo') {
    campos = (
      <>
        <div>
          <span className={etiqueta}>Productos del combo</span>
          <div className="flex flex-col gap-2">
            {m.filas.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <SelectProducto
                  id={`combo-producto-${i}`}
                  productos={productos}
                  valor={f.productoId}
                  onChange={(id) => cambiar({ filas: m.filas.map((x, j) => (j === i ? { ...x, productoId: id } : x)) })}
                  className={selectEnFila}
                />
                <Cantidad
                  valor={f.cantidad}
                  onChange={(n) => cambiar({ filas: m.filas.map((x, j) => (j === i ? { ...x, cantidad: n } : x)) })}
                  etiquetaAccesible={`Cantidad del producto ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => cambiar({ filas: m.filas.filter((_, j) => j !== i) })}
                  disabled={m.filas.length <= 2}
                  aria-label={`Quitar el producto ${i + 1}`}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded border bg-red-100 text-danger hover:bg-red-200 disabled:opacity-40"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          {m.filas.length < 8 && (
            <button
              type="button"
              onClick={() => cambiar({ filas: [...m.filas, { productoId: null, cantidad: 1 }] })}
              className="mt-2 inline-flex items-center gap-1 rounded border border-orange-300 bg-white px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50"
            >
              <Plus size={16} /> Agregar producto
            </button>
          )}
          <ErrorCampo mensaje={errores.filas} />
        </div>
        <div>
          <span className={etiqueta}>Precio del combo</span>
          <div className="mb-2 flex flex-wrap gap-2">
            <button type="button" className={chip(m.modoPrecio === 'porcentaje')} onClick={() => cambiar({ modoPrecio: 'porcentaje' })}>Con % de descuento</button>
            <button type="button" className={chip(m.modoPrecio === 'precioFinal')} onClick={() => cambiar({ modoPrecio: 'precioFinal' })}>Precio final</button>
          </div>
          {m.modoPrecio === 'porcentaje' ? (
            <span className="flex items-center gap-1">
              <input type="number" min={1} max={90} aria-label="Descuento del combo" value={m.porcentaje || ''} onChange={(e) => cambiar({ porcentaje: Number(e.target.value) || 0 })} className={`${campo} w-20`} />
              % sobre el total
            </span>
          ) : (
            <span className="flex items-center gap-1">
              $
              <input type="number" min={1} step={500} aria-label="Precio final del combo" value={m.precioFinal ?? ''} onChange={(e) => cambiar({ precioFinal: Number(e.target.value) || null })} className={`${campo} w-36`} />
            </span>
          )}
          {p && (
            <p className={ayuda}>
              Separado sale {formatearPrecio(p.lista)}.{p.ahorro > 0 && ` El cliente ahorra ${p.ahorro}%.`}
            </p>
          )}
          <ErrorCampo mensaje={errores.precio} />
        </div>
      </>
    )
  }

  const diasLlenosElegidos = dias.filter(lleno)

  return (
    <>
      <EditorConVista
        editor={
          <>
            <p className="font-bold">{promo ? (promo.activo ? 'Editar promo' : 'Promo pausada') : `Nueva promo para el ${nombreDia(diaInicial).toLowerCase()}`}</p>

            {tieneEliminados && (
              <p className="flex gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle size={18} className="shrink-0" />
                Un producto de esta promo fue eliminado. Elegí otro para que vuelva a mostrarse.
              </p>
            )}
            {inicial.aproximada && (
              <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Esta promo tenía un descuento distinto en cada producto. Se abre como combo con el descuento promedio: revisalo antes de guardar.
              </p>
            )}

            <div>
              <span className={etiqueta}>¿Qué tipo de promo?</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MECANICAS.map((x) => (
                  <button
                    key={x.valor}
                    type="button"
                    onClick={() => cambiar({ tipo: x.valor })}
                    aria-pressed={m.tipo === x.valor}
                    className={`rounded border p-2 text-left text-sm transition-colors ${
                      m.tipo === x.valor ? 'border-orange-400 bg-orange-100 text-orange-900' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="block font-semibold">{x.titulo}</span>
                    <span className="block text-xs text-gray-600">{x.ayuda}</span>
                  </button>
                ))}
              </div>
            </div>

            {campos}

            <div>
              <span className={etiqueta}>¿Qué días?</span>
              <div className="flex flex-wrap gap-1.5">
                {DIAS.map((d) => (
                  <button
                    key={d.valor}
                    type="button"
                    aria-pressed={dias.includes(d.valor)}
                    title={lleno(d.valor) ? `${d.nombre}: ya tiene ${maxPorDia} promos` : d.nombre}
                    onClick={() => alternarDia(d.valor)}
                    className={chip(dias.includes(d.valor))}
                  >
                    {d.corto}
                    {lleno(d.valor) && <span className="ml-1 text-xs opacity-70">·{maxPorDia}</span>}
                  </button>
                ))}
              </div>
              <ErrorCampo mensaje={errorDias} />
              {diasLlenosElegidos.map((dia) => (
                <div key={dia} className="mt-2 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                  <p className="font-semibold text-amber-900">El {nombreDia(dia).toLowerCase()} ya tiene {maxPorDia} promos. Elegí cuál sacar de ese día:</p>
                  {otrasDelDia(dia).map((o) => (
                    <label key={o.id} className="mt-1.5 flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name={`sacar-${dia}`}
                        checked={saca[dia] === o.id}
                        onChange={() => { setSaca((s) => ({ ...s, [dia]: o.id })); setErrorSaca((e) => ({ ...e, [dia]: '' })) }}
                      />
                      {o.titulo}
                    </label>
                  ))}
                  <p className="mt-1.5 text-xs text-amber-800">No se borra: deja de estar ese día. Si se queda sin días, pasa a «Pausadas».</p>
                  <ErrorCampo mensaje={errorSaca[dia]} />
                </div>
              ))}
            </div>

            <div>
              <label htmlFor="dia-titulo" className={etiqueta}>Título</label>
              <input
                id="dia-titulo"
                type="text"
                maxLength={60}
                value={tituloMostrado}
                onChange={(e) => { setTitulo(e.target.value); setTituloTocado(true) }}
                className={campo}
              />
              <p className={ayuda}>Se arma solo con lo que elegiste. Podés cambiarlo.</p>
            </div>

            <ErrorGeneral mensaje={error} />
            <Acciones
              guardando={guardando}
              onCancelar={onCerrar}
              onGuardar={guardar}
              textoGuardar={promo && !promo.activo ? 'Guardar y activar' : promo ? 'Guardar cambios' : 'Agregar promo'}
              extra={promo && (
                <>
                  {promo.activo && (
                    <button type="button" onClick={pausar} disabled={guardando} className={botonSecundario}>Pausar</button>
                  )}
                  <button type="button" onClick={() => setConfirmarEliminar(true)} disabled={guardando} className={`${botonSecundario} text-danger`}>
                    Eliminar
                  </button>
                </>
              )}
            />
          </>
        }
        vista={
          <div
            className="flex items-center gap-4 rounded-[1.5rem] border-2 p-4 text-white"
            style={{ background: MARCA.rojo, borderColor: MARCA.oscuro, boxShadow: `6px 6px 0 ${MARCA.oscuro}` }}
          >
            <span
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full p-1 text-center font-extrabold leading-tight"
              style={{ background: MARCA.mostaza, color: MARCA.oscuro }}
            >
              <span>
                <span className="block text-lg">{p ? circ : '?'}</span>
                {p && circ.endsWith('%') && <span className="block text-[11px]">OFF</span>}
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-lg font-extrabold leading-tight">{tituloMostrado || 'Elegí qué ofrecés'}</p>
              {p && <p className="mt-1 text-sm text-white/85">{detalleSugerido(m, productos)}</p>}
              {p && (
                <p className="mt-1">
                  <span className="font-extrabold">{formatearPrecio(p.conPromo)}</span>{' '}
                  {p.lista > p.conPromo && <s className="text-sm text-white/70">{formatearPrecio(p.lista)}</s>}
                </p>
              )}
            </div>
          </div>
        }
      />
      <ConfirmarEliminacion
        abierto={confirmarEliminar}
        titulo="Eliminar promo"
        textoConfirmar="Eliminar"
        mensaje={`¿Eliminar "${promo?.titulo}"? Si solo querés sacarla un tiempo, usá «Pausar».`}
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarEliminar(false)}
      />
    </>
  )
}
