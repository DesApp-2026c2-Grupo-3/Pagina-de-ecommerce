import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import EstrellasPromedio, { formatearPromedio } from '../../components/EstrellasPromedio'
import Paginacion from '../../components/Paginacion'
import MensajeVacio from '../../components/MensajeVacio'
import { useAuth } from '../../context/AuthContext'
import {
  obtenerCalificaciones,
  obtenerOpcionesFiltros,
  obtenerResumenCalificaciones,
} from '../../services/calificacionService'
import type {
  CalificacionAdmin,
  FiltrosCalificaciones,
  OpcionesFiltros,
  PromedioDe,
  ResumenCalificaciones,
} from '../../types/calificacion.types'

const POR_PAGINA = 10

type Periodo = 'todo' | '7' | '30' | '90' | 'personalizado'

const PERIODOS: { valor: Exclude<Periodo, 'personalizado'>; etiqueta: string }[] = [
  { valor: 'todo', etiqueta: 'Todo' },
  { valor: '7', etiqueta: '7 días' },
  { valor: '30', etiqueta: '30 días' },
  { valor: '90', etiqueta: '90 días' },
]

const FILTROS_VACIOS: FiltrosCalificaciones = {
  sucursalId: '',
  productoId: '',
  puntaje: '',
  conComentario: false,
  desde: '',
  hasta: '',
}

const campo = 'w-full rounded border bg-white p-2 text-sm'
const tarjeta = 'rounded-lg border bg-white p-5'
const chip = 'rounded-full border px-3 py-1 text-xs font-semibold transition-colors'

// AAAA-MM-DD de hace N días, en la hora de la computadora del admin
function fechaHaceDias(dias: number) {
  const f = new Date()
  f.setDate(f.getDate() - dias)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`
}

const formatearFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatearSemana = (aaaammdd: string) => {
  const [, mes, dia] = aaaammdd.split('-')
  return `${dia}/${mes}`
}

// Una fila con estrellas y promedio, que se puede tocar para filtrar
function FilaPromedio({ item, onElegir }: { item: PromedioDe; onElegir: (id: number) => void }) {
  const contenido = (
    <>
      <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">{item.nombre}</span>
      <EstrellasPromedio valor={item.promedio} tamanio={14} />
      <span className="w-9 shrink-0 text-right text-sm font-semibold">
        {item.promedio === null ? '—' : formatearPromedio(item.promedio)}
      </span>
      <span className="w-10 shrink-0 text-right text-xs text-gray-500">({item.total})</span>
    </>
  )
  if (item.id === null) return <li className="flex items-center gap-3 px-2 py-2">{contenido}</li>
  return (
    <li>
      <button
        type="button"
        onClick={() => onElegir(item.id as number)}
        title="Filtrar por esta opción"
        className="flex w-full items-center gap-3 rounded px-2 py-2 transition-colors hover:bg-orange-50"
      >
        {contenido}
      </button>
    </li>
  )
}

export default function Calificaciones() {
  const { administrador } = useAuth()
  const esMaster = administrador?.rol === 'MASTER'

  const [filtros, setFiltros] = useState<FiltrosCalificaciones>(FILTROS_VACIOS)
  const [periodo, setPeriodo] = useState<Periodo>('todo')
  const [pagina, setPagina] = useState(1)

  const [opciones, setOpciones] = useState<OpcionesFiltros>({ sucursales: [], productos: [] })
  const [resumen, setResumen] = useState<ResumenCalificaciones | null>(null)
  const [lista, setLista] = useState<CalificacionAdmin[]>([])
  const [totalLista, setTotalLista] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerOpcionesFiltros()
      .then(setOpciones)
      .catch(() => setError('No se pudieron cargar los filtros.'))
  }, [])

  // Los filtros, como texto: sirve para saber cuándo hay que volver a pedir el resumen
  const clave = useMemo(() => JSON.stringify(filtros), [filtros])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    obtenerResumenCalificaciones(filtros)
      .then((datos) => {
        if (cancelado) return
        setResumen(datos)
        setError('')
      })
      .catch((err) => !cancelado && setError(err instanceof Error ? err.message : 'No se pudo cargar el resumen.'))
      .finally(() => !cancelado && setCargando(false))
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  useEffect(() => {
    let cancelado = false
    obtenerCalificaciones(filtros, pagina, POR_PAGINA)
      .then((datos) => {
        if (cancelado) return
        setLista(datos.calificaciones)
        setTotalLista(datos.total)
      })
      .catch((err) => !cancelado && setError(err instanceof Error ? err.message : 'No se pudieron cargar las calificaciones.'))
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, pagina])

  function cambiar(cambios: Partial<FiltrosCalificaciones>) {
    setFiltros((prev) => ({ ...prev, ...cambios }))
    setPagina(1)
  }

  function elegirPeriodo(valor: Exclude<Periodo, 'personalizado'>) {
    setPeriodo(valor)
    cambiar({ desde: valor === 'todo' ? '' : fechaHaceDias(Number(valor)), hasta: '' })
  }

  function cambiarFecha(cambios: Pick<FiltrosCalificaciones, 'desde'> | Pick<FiltrosCalificaciones, 'hasta'>) {
    setPeriodo('personalizado')
    cambiar(cambios)
  }

  function limpiar() {
    setFiltros(FILTROS_VACIOS)
    setPeriodo('todo')
    setPagina(1)
  }

  const hayFiltros = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VACIOS)
  const hayDatos = (resumen?.total ?? 0) > 0
  const maximoDistribucion = resumen ? Math.max(1, ...Object.values(resumen.distribucion)) : 1

  return (
    <main className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Opinión de los clientes</p>
        <h1 className="text-3xl font-bold">Calificaciones</h1>
        <p className="mt-2 text-gray-600">
          {esMaster
            ? 'Las calificaciones de todas las sucursales.'
            : `Las calificaciones de tu sucursal${administrador?.sucursal ? `: ${administrador.sucursal.nombre}` : ''}.`}{' '}
          Cada una corresponde a un pedido completo.
        </p>
      </div>

      {/* ---------- Filtros ---------- */}
      <section className={`${tarjeta} mb-6`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {esMaster && (
            <div>
              <label htmlFor="f-sucursal" className="mb-1 block text-sm font-medium">Sucursal</label>
              <select
                id="f-sucursal"
                value={filtros.sucursalId}
                onChange={(e) => cambiar({ sucursalId: e.target.value })}
                className={campo}
              >
                <option value="">Todas las sucursales</option>
                {opciones.sucursales.map((s) => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="f-producto" className="mb-1 block text-sm font-medium">Producto</label>
            <select
              id="f-producto"
              value={filtros.productoId}
              onChange={(e) => cambiar({ productoId: e.target.value })}
              className={campo}
            >
              <option value="">Todos los productos</option>
              {opciones.productos.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-puntaje" className="mb-1 block text-sm font-medium">Estrellas</label>
            <select
              id="f-puntaje"
              value={filtros.puntaje}
              onChange={(e) => cambiar({ puntaje: e.target.value })}
              className={campo}
            >
              <option value="">Todas</option>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={filtros.conComentario}
                onChange={(e) => cambiar({ conComentario: e.target.checked })}
                className="h-4 w-4"
              />
              Solo con comentario
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <span className="mb-1 block text-sm font-medium">Período</span>
            <div className="flex flex-wrap gap-2">
              {PERIODOS.map((p) => (
                <button
                  key={p.valor}
                  type="button"
                  aria-pressed={periodo === p.valor}
                  onClick={() => elegirPeriodo(p.valor)}
                  className={`${chip} ${periodo === p.valor ? 'border-orange-400 bg-orange-50 text-orange-700' : 'hover:bg-gray-50'}`}
                >
                  {p.etiqueta}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div>
              <label htmlFor="f-desde" className="mb-1 block text-sm font-medium">Desde</label>
              <input
                id="f-desde"
                type="date"
                value={filtros.desde}
                max={filtros.hasta || undefined}
                onChange={(e) => cambiarFecha({ desde: e.target.value })}
                className="rounded border p-1.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="f-hasta" className="mb-1 block text-sm font-medium">Hasta</label>
              <input
                id="f-hasta"
                type="date"
                value={filtros.hasta}
                min={filtros.desde || undefined}
                onChange={(e) => cambiarFecha({ hasta: e.target.value })}
                className="rounded border p-1.5 text-sm"
              />
            </div>
          </div>

          {hayFiltros && (
            <button type="button" onClick={limpiar} className="pb-1.5 text-sm font-semibold text-orange-700 underline">
              Limpiar filtros
            </button>
          )}
        </div>

        {filtros.productoId && (
          <p className="mt-3 text-sm text-gray-600">
            Se muestran los pedidos que incluyen ese producto: la calificación es del pedido completo, no solo del producto.
          </p>
        )}
      </section>

      {error && <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando && !resumen ? (
        <p className="text-gray-600">Cargando...</p>
      ) : !resumen || !hayDatos ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio
            mensaje={hayFiltros ? 'No hay calificaciones con esos filtros.' : 'Todavía no hay calificaciones.'}
          />
        </div>
      ) : (
        <>
          {/* ---------- Promedio y distribución ---------- */}
          <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
            <section className={`${tarjeta} flex flex-col items-center justify-center text-center`}>
              <p className="text-6xl font-extrabold leading-none">
                {resumen.promedio === null ? '—' : formatearPromedio(resumen.promedio)}
              </p>
              <div className="mt-3">
                <EstrellasPromedio valor={resumen.promedio} tamanio={30} />
              </div>
              <p className="mt-3 text-sm text-gray-600">
                {resumen.total} {resumen.total === 1 ? 'calificación' : 'calificaciones'} · {resumen.conComentario} con comentario
              </p>
            </section>

            <section className={tarjeta}>
              <h2 className="mb-3 font-bold">¿Cómo se reparten las estrellas?</h2>
              <ul className="flex flex-col gap-2">
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const cantidad = resumen.distribucion[n]
                  return (
                    <li key={n} className="flex items-center gap-3 text-sm">
                      <span className="w-9 shrink-0 font-semibold">{n} ★</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{ width: `${(cantidad / maximoDistribucion) * 100}%` }}
                        />
                      </div>
                      <span className="w-20 shrink-0 text-right text-gray-600">
                        {cantidad} ({Math.round((cantidad / resumen.total) * 100)}%)
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>

          {/* ---------- Desgloses ---------- */}
          {(resumen.porSucursal.length > 1 || resumen.porProducto.length > 0) && (
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              {resumen.porSucursal.length > 1 && (
                <section className={tarjeta}>
                  <h2 className="mb-1 font-bold">Por sucursal</h2>
                  <p className="mb-2 text-xs text-gray-500">Tocá una para filtrar.</p>
                  <ul>
                    {resumen.porSucursal.map((s) => (
                      <FilaPromedio key={s.id ?? 'sin'} item={s} onElegir={(id) => cambiar({ sucursalId: String(id) })} />
                    ))}
                  </ul>
                </section>
              )}

              {resumen.porProducto.length > 0 && (
                <section className={tarjeta}>
                  <h2 className="mb-1 font-bold">Productos con más calificaciones</h2>
                  <p className="mb-2 text-xs text-gray-500">
                    Promedio de los pedidos que los incluyen. Tocá uno para filtrar.
                  </p>
                  <ul>
                    {resumen.porProducto.map((p) => (
                      <FilaPromedio key={p.id} item={p} onElegir={(id) => cambiar({ productoId: String(id) })} />
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {/* ---------- Evolución ---------- */}
          {resumen.porSemana.length > 1 && (
            <section className={`${tarjeta} mb-6`}>
              <h2 className="mb-3 font-bold">Evolución semanal</h2>
              <div className="flex h-32 items-end gap-2">
                {resumen.porSemana.map((s) => (
                  <div
                    key={s.semana}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                    title={`Semana del ${formatearSemana(s.semana)}: ${s.promedio === null ? '—' : formatearPromedio(s.promedio)} (${s.total})`}
                  >
                    <span className="text-xs font-semibold">{s.promedio === null ? '' : formatearPromedio(s.promedio)}</span>
                    <div
                      className="w-full max-w-10 rounded-t bg-yellow-400"
                      style={{ height: `${((s.promedio ?? 0) / 5) * 100}%` }}
                    />
                    <span className="text-[11px] text-gray-500">{formatearSemana(s.semana)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ---------- Calificaciones una por una ---------- */}
          <section>
            <h2 className="mb-3 text-xl font-bold">Todas las calificaciones</h2>
            <ul className="flex flex-col gap-3">
              {lista.map((c) => (
                <li key={c.id} className="rounded-lg border bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <EstrellasPromedio valor={c.puntaje} tamanio={18} />
                      <span className="text-sm font-semibold">{c.puntaje}/5</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatearFecha(c.fecha)}</span>
                  </div>

                  <p className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">
                      {c.cliente.nombre} {c.cliente.apellido ?? ''}
                    </span>
                    {' · '}Pedido #{c.pedido.id}
                    {c.pedido.total !== null && ` · $${c.pedido.total.toLocaleString('es-AR')}`}
                    {esMaster && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs">{c.sucursal.nombre}</span>}
                  </p>

                  {c.productos.length > 0 && <p className="mt-1 text-xs text-gray-500">{c.productos.join(' · ')}</p>}

                  {c.comentario ? (
                    <p className="mt-3 flex gap-2 rounded bg-gray-50 p-3 text-sm italic text-gray-800">
                      <MessageSquareText size={16} className="mt-0.5 shrink-0 text-gray-400" />
                      <span className="break-words">“{c.comentario}”</span>
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-gray-400">Sin comentario</p>
                  )}
                </li>
              ))}
            </ul>

            <Paginacion
              paginaActual={pagina}
              totalElementos={totalLista}
              elementosPorPagina={POR_PAGINA}
              cambiarPagina={setPagina}
            />
          </section>
        </>
      )}
    </main>
  )
}
