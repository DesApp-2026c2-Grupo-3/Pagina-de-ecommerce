// Bloque 2: la franja amarilla de la página de Promos (regalo de la semana)
import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import { actualizarPromocion, crearPromocion, deshabilitarPromocion } from '../../services/promocionService'
import {
  Acciones, EditorConVista, ErrorCampo, ErrorGeneral, MARCA, SelectProducto, TarjetaBloque,
  ayuda, botonSecundario, campo, etiqueta, formatearPrecio,
} from './comun'

interface Props {
  promo: PromocionAdmin | null
  /** Una promo elegida desde la lista (puede estar deshabilitada). Si no hay, se edita la publicada */
  editando?: PromocionAdmin | null
  /** Crear una nueva: al guardar reemplaza a la publicada (que queda deshabilitada) */
  crear?: boolean
  productos: ProductoOpcion[]
  abierta: boolean
  onAbrir: () => void
  onCerrar: () => void
  onGuardado: (mensaje: string) => void
}

export default function BloqueRegalo({ promo, editando = null, crear = false, productos, abierta, onAbrir, onCerrar, onGuardado }: Props) {
  const actual = promo?.items[0]
  // La que se edita: la elegida en la lista o, si no, la publicada
  const objetivo = crear ? null : editando ?? promo
  const [productoId, setProductoId] = useState<number | null>(null)
  const [minima, setMinima] = useState('')
  const [errores, setErrores] = useState<{ producto?: string; minima?: string }>({})
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Al abrirse (desde «Cambiar» o desde la lista) se cargan los datos de la promo
  useEffect(() => {
    if (!abierta) return
    setProductoId(objetivo?.items[0]?.productoId ?? null)
    setMinima(objetivo?.compraMinima ? String(objetivo.compraMinima) : '')
    setErrores({})
    setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, objetivo?.id])

  const producto = productos.find((p) => p.id === productoId)
  const m = Number(minima) || 0

  async function guardar() {
    const nuevos: typeof errores = {}
    if (!producto) nuevos.producto = 'Elegí qué se regala'
    if (!(Number.isInteger(m) && m >= 0 && m <= 1000000)) nuevos.minima = 'Poné un monto entero entre $0 y $1.000.000'
    setErrores(nuevos)
    if (Object.keys(nuevos).length || !producto) return

    const datos = {
      tipo: 'REGALO',
      titulo: `${producto.nombre} gratis`.slice(0, 60),
      destacado: 'Gratis',
      detalle: m ? `${producto.nombre} sin cargo con compras desde ${formatearPrecio(m)}.` : `${producto.nombre} sin cargo con tu pedido.`,
      dias: null,
      maxPorPedido: 1,
      compraMinima: m || null,
      activo: objetivo ? objetivo.activo : true,
      items: [{ productoId: producto.id, cantidad: 1, descuento: 1 }],
    }
    setGuardando(true)
    setError('')
    try {
      if (objetivo) await actualizarPromocion(objetivo.id, datos)
      else {
        // Hay una sola publicada: la nueva toma su lugar
        if (promo?.activo) await deshabilitarPromocion(promo.id)
        await crearPromocion(datos)
      }
      onGuardado('Regalo actualizado')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el regalo.')
    } finally {
      setGuardando(false)
    }
  }

  async function sacar() {
    if (!objetivo) return
    setGuardando(true)
    try {
      await deshabilitarPromocion(objetivo.id)
      onGuardado('Se sacó el regalo de la página')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sacar el regalo.')
    } finally {
      setGuardando(false)
    }
  }

  const resumen = promo && actual ? (
    <>
      <span className="font-semibold">{actual.nombre ?? 'Producto eliminado'}</span> gratis ·{' '}
      {promo.compraMinima ? `con compras desde ${formatearPrecio(promo.compraMinima)}` : 'sin compra mínima'}
      {!promo.completa && <p className="mt-1 font-semibold text-red-700">El producto fue eliminado: la franja no se muestra hasta que elijas otro.</p>}
    </>
  ) : (
    <span className="opacity-80">No hay regalo de la semana: la franja no se muestra.</span>
  )

  return (
    <TarjetaBloque numero={2} lugar="Franja amarilla" titulo="Regalo de la semana" resumen={resumen} abierta={abierta} onAbrir={onAbrir}>
      <EditorConVista
        editor={
          <>
            {crear && promo?.activo && (
              <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Hoy la franja muestra «{promo.titulo}». Al guardar, esta nueva la reemplaza y la anterior queda deshabilitada en la lista.
              </p>
            )}
            {objetivo && !objetivo.activo && (
              <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Estás editando una promo deshabilitada: no se ve en la tienda. Para mostrarla, habilitala desde la lista.
              </p>
            )}
            <div>
              <label htmlFor="regalo-producto" className={etiqueta}>Producto de regalo</label>
              <SelectProducto id="regalo-producto" productos={productos} valor={productoId} onChange={(id) => { setProductoId(id); setErrores((e) => ({ ...e, producto: undefined })) }} />
              <ErrorCampo mensaje={errores.producto} />
            </div>
            <div>
              <label htmlFor="regalo-minima" className={etiqueta}>Compra mínima (opcional)</label>
              <span className="flex items-center gap-1">
                $
                <input
                  id="regalo-minima"
                  type="number"
                  min={0}
                  step={500}
                  value={minima}
                  onChange={(e) => { setMinima(e.target.value); setErrores((x) => ({ ...x, minima: undefined })) }}
                  placeholder="Sin mínimo"
                  className={`${campo} sm:max-w-[10rem]`}
                />
              </span>
              <p className={ayuda}>Lo que tiene que sumar el resto del pedido. Vacío = sin mínimo.</p>
              <ErrorCampo mensaje={errores.minima} />
            </div>
            <ErrorGeneral mensaje={error} />
            <Acciones
              guardando={guardando}
              onCancelar={onCerrar}
              onGuardar={guardar}
              extra={objetivo?.activo && (
                <button type="button" onClick={sacar} disabled={guardando} className={botonSecundario}>
                  Sacar de la página
                </button>
              )}
            />
          </>
        }
        vista={
          <div className="rounded-[1.5rem] border-2 px-5 py-4" style={{ background: MARCA.mostaza, borderColor: MARCA.oscuro, boxShadow: `6px 6px 0 ${MARCA.oscuro}`, color: MARCA.oscuro }}>
            <p className="flex items-center gap-3 font-extrabold">
              <Gift className="h-6 w-6 shrink-0" />
              <span>
                {producto ? `${producto.nombre} gratis` : '…'} toda la semana
                <span className="block text-sm font-bold opacity-80">{m ? `Con compras desde ${formatearPrecio(m)}` : 'Sin compra mínima'}</span>
              </span>
            </p>
            <span className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-bold" style={{ background: MARCA.oscuro, color: MARCA.crema }}>
              Sumalas gratis →
            </span>
          </div>
        }
      />
    </TarjetaBloque>
  )
}
