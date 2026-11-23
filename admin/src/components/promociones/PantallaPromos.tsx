// Vista de crear y editar promociones (se llega desde la lista).
//  - Nueva: muestra las 4 partes de la página de Promos como pestañas; al elegir una, se ve solo esa.
//  - Editar: muestra solo la pestaña de la promo elegida, con sus datos cargados.
// Al guardar o cancelar se vuelve a la lista.
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { obtenerPromociones, obtenerProductoNuevo } from '../../services/promocionService'
import { obtenerProductos } from '../../services/productoService'
import { obtenerParametros } from '../../services/parametroService'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import BloqueProductoSemana from './BloqueProductoSemana'
import BloqueRegalo from './BloqueRegalo'
import BloqueNuevo from './BloqueNuevo'
import SemanaPromos, { type AbiertoSemana } from './SemanaPromos'
import EditorPromoDia from './EditorPromoDia'

type Pestania = 'semana' | 'regalo' | 'nuevo' | 'dias'

const PESTANIAS: { id: Pestania; lugar: string; titulo: string; ayuda: string }[] = [
  { id: 'semana', lugar: 'Banner', titulo: 'Producto de la semana', ayuda: 'Un producto con descuento toda la semana' },
  { id: 'regalo', lugar: 'Franja', titulo: 'Regalo de la semana', ayuda: 'Un producto gratis con compra mínima' },
  { id: 'nuevo', lugar: 'Bloque «Nuevo»', titulo: 'Nuevo en la carta', ayuda: 'Un producto presentado como lanzamiento' },
  { id: 'dias', lugar: 'Pestañas por día', titulo: 'La semana en promos', ayuda: 'Hasta 3 promos distintas cada día' },
]

const pestaniaDe = (p: PromocionAdmin): Pestania => (p.tipo === 'SEMANA' ? 'semana' : p.tipo === 'REGALO' ? 'regalo' : 'dias')

export default function PantallaPromos({ idEditar }: { idEditar?: number }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { mostrarToast } = useToast()
  const editando = idEditar !== undefined

  const [promos, setPromos] = useState<PromocionAdmin[]>([])
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [productoNuevoId, setProductoNuevoId] = useState<number | null>(null)
  const [maxPorDia, setMaxPorDia] = useState(3)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Desde el reporte de menos vendidos se llega con un producto: se abre la semana con una promo nueva para hoy
  const productoParaPromo = (location.state as { productoParaPromo?: number } | null)?.productoParaPromo
  // Desde la lista se puede llegar directo a una pestaña (por ejemplo, «Nuevo en la carta»)
  const pestaniaInicial = (location.state as { pestania?: Pestania } | null)?.pestania ?? null
  const [pestania, setPestania] = useState<Pestania | null>(productoParaPromo ? 'dias' : pestaniaInicial)
  const [abiertoDia, setAbiertoDia] = useState<AbiertoSemana>(
    productoParaPromo ? { dia: new Date().getDay(), promoId: null, productoId: productoParaPromo } : null,
  )

  const cargar = useCallback(async () => {
    try {
      const [lista, nuevo] = await Promise.all([obtenerPromociones(), obtenerProductoNuevo()])
      setPromos(lista)
      setProductoNuevoId(nuevo.productoId)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones.')
    }
  }, [])

  useEffect(() => {
    Promise.all([
      cargar(),
      obtenerProductos()
        .then((lista: any[]) =>
          setProductos(
            lista
              .map((p) => ({ id: p.id as number, nombre: p.nombre as string, precio: Number(p.precio) }))
              .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
          ),
        )
        .catch(() => setError('No se pudo cargar la lista de productos. Revisá que el backend esté funcionando.')),
      obtenerParametros()
        .then((p) => setMaxPorDia(p.maxPromosPorDia))
        .catch(() => setMaxPorDia(3)),
    ]).finally(() => setCargando(false))
  }, [cargar])

  const volver = () => navigate('/admin/promociones')
  const terminar = (mensaje: string) => {
    mostrarToast(mensaje)
    volver()
  }
  // En la semana se hacen varias cosas seguidas (quitar, sumar, crear): se queda en la vista
  const cambioEnLaSemana = async (mensaje: string) => {
    mostrarToast(mensaje)
    setAbiertoDia(null)
    await cargar()
  }

  const semana = promos.find((p) => p.tipo === 'SEMANA' && p.activo) ?? null
  const regalo = promos.find((p) => p.tipo === 'REGALO' && p.activo) ?? null
  const delDia = promos.filter((p) => p.tipo === 'DIA')
  const promoEditada = editando ? promos.find((p) => p.id === idEditar) ?? null : null
  const visible: Pestania | null = editando ? (promoEditada ? pestaniaDe(promoEditada) : null) : pestania
  const sinCambios = () => {}

  return (
    <main className="p-4 sm:p-8">
      <button type="button" onClick={volver} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} /> Volver a la lista
      </button>
      <h1 className="text-3xl font-bold">{editando ? 'Editar promoción' : 'Nueva promoción'}</h1>
      <p className="mt-2 text-gray-600">
        {editando ? 'Cambiá lo que necesites y guardá.' : 'Elegí qué parte de la página de Promos querés armar.'}
      </p>

      {error && <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="mt-6 text-gray-600">Cargando...</p>
      ) : editando && !promoEditada ? (
        <p className="mt-6 text-gray-600">No se encontró la promoción. Puede que la hayan eliminado.</p>
      ) : (
        <>
          {/* Pestañas: las 4 al crear; al editar, solo la que corresponde */}
          <div role="tablist" className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {PESTANIAS.filter((t) => !editando || t.id === visible).map((t) => {
              const elegida = t.id === visible
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={elegida}
                  disabled={editando}
                  onClick={() => { setPestania(t.id); setAbiertoDia(null) }}
                  className={`rounded-lg border p-3 text-left transition-colors disabled:cursor-default ${
                    elegida ? 'border-orange-400 bg-orange-50' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">{t.lugar}</span>
                  <span className="block font-bold">{t.titulo}</span>
                  {!visible && <span className="mt-1 block text-sm text-gray-600">{t.ayuda}</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-4">
            {visible === 'semana' && (
              <BloqueProductoSemana
                promo={semana}
                editando={promoEditada}
                crear={!editando}
                productos={productos}
                abierta
                onAbrir={sinCambios}
                onCerrar={volver}
                onGuardado={terminar}
              />
            )}
            {visible === 'regalo' && (
              <BloqueRegalo
                promo={regalo}
                editando={promoEditada}
                crear={!editando}
                productos={productos}
                abierta
                onAbrir={sinCambios}
                onCerrar={volver}
                onGuardado={terminar}
              />
            )}
            {visible === 'nuevo' && (
              <BloqueNuevo
                productoId={productoNuevoId}
                productos={productos}
                abierta
                onAbrir={sinCambios}
                onCerrar={volver}
                onGuardado={terminar}
              />
            )}
            {visible === 'dias' && !editando && (
              <SemanaPromos
                promos={delDia}
                productos={productos}
                maxPorDia={maxPorDia}
                abierto={abiertoDia}
                onAbrir={setAbiertoDia}
                onCerrar={() => setAbiertoDia(null)}
                onGuardado={cambioEnLaSemana}
              />
            )}
            {visible === 'dias' && editando && promoEditada && (
              <section className="rounded-xl border bg-white p-4 sm:p-5">
                <EditorPromoDia
                  promo={promoEditada}
                  diaInicial={promoEditada.dias[0] ?? 1}
                  activas={delDia.filter((p) => p.activo)}
                  productos={productos}
                  maxPorDia={maxPorDia}
                  onCerrar={volver}
                  onGuardado={terminar}
                />
              </section>
            )}
          </div>
        </>
      )}
    </main>
  )
}
