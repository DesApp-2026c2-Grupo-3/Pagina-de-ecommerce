// Bloque 1: el banner rojo de la página de Promos (producto de la semana)
import { useState } from 'react'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import { actualizarPromocion, crearPromocion, deshabilitarPromocion } from '../../services/promocionService'
import {
  Acciones, EditorConVista, ErrorCampo, ErrorGeneral, MARCA, SelectProducto, TarjetaBloque,
  ayuda, botonSecundario, campo, chip, etiqueta, formatearPrecio,
} from './comun'

const ATAJOS = [10, 15, 20, 25]

interface Props {
  promo: PromocionAdmin | null
  productos: ProductoOpcion[]
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

export default function BloqueProductoSemana({ promo, productos, abierta, onAbrir, onCerrar, onGuardado }: Props) {
  const actual = promo?.items[0]
  const [productoId, setProductoId] = useState<number | null>(null)
  const [porcentaje, setPorcentaje] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tituloTocado, setTituloTocado] = useState(false)
  const [errores, setErrores] = useState<{ producto?: string; porcentaje?: string }>({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const nombreDe = (id: number | null) => productos.find((p) => p.id === id)?.nombre ?? ''

  function abrir() {
    setProductoId(actual?.productoId ?? null)
    setPorcentaje(actual ? String(Math.round(actual.descuento * 100)) : '20')
    setTitulo(promo?.titulo ?? '')
    setTituloTocado(Boolean(promo) && promo?.titulo !== nombreDe(actual?.productoId ?? null))
    setErrores({})
    setError('')
    onAbrir()
  }

  function elegirProducto(id: number | null) {
    setProductoId(id)
    setErrores((e) => ({ ...e, producto: undefined }))
    if (!tituloTocado) setTitulo(nombreDe(id))
  }

  const producto = productos.find((p) => p.id === productoId)
  const d = Number(porcentaje) || 0

  async function guardar() {
    const nuevos: typeof errores = {}
    if (!producto) nuevos.producto = 'Elegí un producto'
    if (!(Number.isInteger(d) && d >= 1 && d <= 90)) nuevos.porcentaje = 'Poné un descuento entre 1 y 90 %'
    setErrores(nuevos)
    if (Object.keys(nuevos).length || !producto) return

    const datos = {
      tipo: 'SEMANA',
      titulo: (titulo.trim() || producto.nombre).slice(0, 60),
      destacado: `${d}%`,
      detalle: `${producto.nombre} con ${d}% de descuento todos los días.`,
      dias: null,
      maxPorPedido: null,
      compraMinima: null,
      activo: true,
      items: [{ productoId: producto.id, cantidad: 1, descuento: d / 100 }],
    }
    setGuardando(true)
    setError('')
    try {
      // Hay uno solo: si ya existe se cambia ese mismo
      if (promo) await actualizarPromocion(promo.id, datos)
      else await crearPromocion(datos)
      onGuardado('Banner actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto de la semana.')
    } finally {
      setGuardando(false)
    }
  }

  async function sacar() {
    if (!promo) return
    setGuardando(true)
    try {
      await deshabilitarPromocion(promo.id)
      onGuardado('Se sacó el producto de la semana de la página')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sacar el producto de la semana.')
    } finally {
      setGuardando(false)
    }
  }

  const resumen = promo && actual ? (
    <>
      <span className="font-semibold">{actual.nombre ?? 'Producto eliminado'}</span> · {Math.round(actual.descuento * 100)}% off
      {actual.precio != null && (
        <> · {formatearPrecio(actual.precio * (1 - actual.descuento))} <span className="opacity-70">(antes {formatearPrecio(actual.precio)})</span></>
      )}
      {!promo.completa && <p className="mt-1 font-semibold text-red-700">El producto fue eliminado: el banner no se muestra hasta que elijas otro.</p>}
    </>
  ) : (
    <span className="opacity-80">No hay producto de la semana: el banner no se muestra.</span>
  )

  return (
    <TarjetaBloque numero={1} lugar="Banner rojo" titulo="Producto de la semana" resumen={resumen} abierta={abierta} onAbrir={abrir} tono="rojo">
      <EditorConVista
        editor={
          <>
            <div>
              <label htmlFor="semana-producto" className={etiqueta}>Producto</label>
              <SelectProducto id="semana-producto" productos={productos} valor={productoId} onChange={elegirProducto} />
              <ErrorCampo mensaje={errores.producto} />
            </div>
            <div>
              <label htmlFor="semana-descuento" className={etiqueta}>Descuento</label>
              <div className="flex flex-wrap items-center gap-2">
                {ATAJOS.map((a) => (
                  <button key={a} type="button" className={chip(d === a)} onClick={() => { setPorcentaje(String(a)); setErrores((e) => ({ ...e, porcentaje: undefined })) }}>
                    {a}%
                  </button>
                ))}
                <span className="flex items-center gap-1">
                  <input
                    id="semana-descuento"
                    type="number"
                    min={1}
                    max={90}
                    value={porcentaje}
                    onChange={(e) => { setPorcentaje(e.target.value); setErrores((x) => ({ ...x, porcentaje: undefined })) }}
                    className={`${campo} w-20`}
                  />
                  %
                </span>
              </div>
              <ErrorCampo mensaje={errores.porcentaje} />
            </div>
            <div>
              <label htmlFor="semana-titulo" className={etiqueta}>Título del banner</label>
              <input
                id="semana-titulo"
                type="text"
                maxLength={60}
                value={titulo}
                onChange={(e) => { setTitulo(e.target.value); setTituloTocado(true) }}
                className={campo}
              />
              <p className={ayuda}>Se completa con el nombre del producto. Podés cambiarlo.</p>
            </div>
            <ErrorGeneral mensaje={error} />
            <Acciones
              guardando={guardando}
              onCancelar={onCerrar}
              onGuardar={guardar}
              extra={promo?.activo && (
                <button type="button" onClick={sacar} disabled={guardando} className={botonSecundario}>
                  Sacar de la página
                </button>
              )}
            />
          </>
        }
        vista={
          <div className="rounded-xl p-4 pb-6" style={{ background: MARCA.oscuro }}>
            <div
              className="-rotate-[1.5deg] rounded-[1.5rem] border-2 p-4 text-white"
              style={{ background: MARCA.rojo, borderColor: MARCA.crema, boxShadow: `8px 8px 0 ${MARCA.mostaza}` }}
            >
              <span className="inline-block rounded-full px-3 py-0.5 text-[11px] font-extrabold uppercase tracking-wider" style={{ background: MARCA.oscuro, color: MARCA.mostaza }}>
                Producto de la semana
              </span>
              <p className="mt-2 text-5xl font-extrabold leading-none">
                {d}%<span className="text-xl"> OFF</span>
              </p>
              <p className="mt-2 text-2xl font-extrabold">{titulo || 'Título'}</p>
              {producto && (
                <p className="mt-1">
                  <span className="text-xl font-extrabold">{formatearPrecio(producto.precio * (1 - d / 100))}</span>{' '}
                  {d > 0 && <s className="font-bold text-white/70">{formatearPrecio(producto.precio)}</s>}
                </p>
              )}
              <span className="mt-3 inline-block rounded-full bg-white px-4 py-2 text-sm font-extrabold" style={{ color: MARCA.oscuro }}>
                La quiero →
              </span>
            </div>
          </div>
        }
      />
    </TarjetaBloque>
  )
}
