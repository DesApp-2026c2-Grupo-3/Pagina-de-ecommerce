import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Ban, Boxes, RotateCcw } from 'lucide-react'
import Paginacion from '../../components/Paginacion'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { obtenerCategorias } from '../../services/categoriaService'
import { verStockProducto } from '../../services/productoService'
import { obtenerSucursales } from '../../services/sucursalService'
import {
  obtenerProductosDeSucursal,
  obtenerSuspensiones,
  rehabilitarProductos,
  suspenderProductos,
} from '../../services/suspensionService'
import type { Sucursal } from '../../types/sucursal.types'
import type { EstadoProducto, ProductoSucursal, SuspensionRegistrada } from '../../types/suspension.types'
import { fechaCorta, haceCuanto } from '../../utils/tiempo'

const POR_PAGINA = 10

interface StockDeProducto {
  nombre: string
  sinReceta: boolean
  sucursales: { id: number; nombre: string; unidades: number | null; limitante: string | null }[]
}

const ESTILO_ESTADO: Record<EstadoProducto, { texto: string; clase: string }> = {
  disponible: { texto: 'Disponible', clase: 'bg-green-100 text-green-700' },
  'sin-stock': { texto: 'Sin stock', clase: 'bg-amber-100 text-amber-800' },
  suspendido: { texto: 'Suspendido', clase: 'bg-red-100 text-red-700' },
  deshabilitado: { texto: 'Deshabilitado', clase: 'bg-gray-200 text-gray-700' },
}

const botonAccion =
  'inline-flex items-center gap-2 rounded border px-3 py-2 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

const cantidad = (n: number, uno: string, varios: string) => (n === 1 ? `1 ${uno}` : `${n} ${varios}`)

function Dialogo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="w-full max-w-md rounded-lg border-2 bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-bold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

// Productos de una sucursal y su estado. El encargado suspende y rehabilita en la suya (transitorio, con motivo);
// el master deshabilita en la sucursal que elija (sin plazo). El encargado levanta solo lo suyo;
// el master levanta cualquier suspensión, también las del encargado.
export default function Disponibilidad() {
  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const esMaster = administrador?.rol === 'MASTER'
  // Desde un parte: /admin/disponibilidad?productos=1,2&motivo=... deja esos productos marcados
  const [params, setParams] = useSearchParams()
  const [motivoSugerido, setMotivoSugerido] = useState('')

  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(esMaster ? null : (administrador?.sucursalId ?? null))
  const [categorias, setCategorias] = useState<{ id: number; nombre: string }[]>([])
  const [productos, setProductos] = useState<ProductoSucursal[]>([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const [vista, setVista] = useState<'productos' | 'registro'>('productos')
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())

  const [dialogo, setDialogo] = useState<'suspender' | 'rehabilitar' | null>(null)
  const [motivo, setMotivo] = useState('')
  const [errorMotivo, setErrorMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Acciones por fila: suspender (o deshabilitar) solo ese producto, y ver su stock en la sucursal
  const [individual, setIndividual] = useState<ProductoSucursal | null>(null)
  const [stockVisto, setStockVisto] = useState<StockDeProducto | null>(null)

  const [registro, setRegistro] = useState<SuspensionRegistrada[]>([])
  const [registroEstado, setRegistroEstado] = useState('activas')
  const [registroSucursal, setRegistroSucursal] = useState('todas')
  const [registroCargando, setRegistroCargando] = useState(false)
  const [registroError, setRegistroError] = useState('')

  useEffect(() => {
    obtenerCategorias()
      .then((c) => setCategorias(Array.isArray(c) ? c : []))
      .catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    if (!esMaster) return
    obtenerSucursales()
      .then((lista) => {
        setSucursales(lista)
        setSucursalId((actual) => actual ?? lista[0]?.id ?? null)
      })
      .catch(() => setError('No se pudieron cargar las sucursales.'))
  }, [esMaster])

  const cargar = useCallback(async () => {
    if (sucursalId == null) return
    setCargando(true)
    setError('')
    try {
      setProductos(await obtenerProductosDeSucursal(sucursalId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.')
    } finally {
      setCargando(false)
    }
  }, [sucursalId])

  useEffect(() => {
    void cargar()
  }, [cargar])

  useEffect(() => {
    const ids = params.get('productos')
    if (!ids || productos.length === 0) return
    const pedidos = ids.split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)
    setSeleccion(new Set(pedidos.filter((id) => productos.some((p) => p.id === id))))
    setMotivoSugerido(params.get('motivo') ?? '')
    setParams({}, { replace: true })
  }, [params, productos, setParams])

  useEffect(() => {
    if (vista !== 'registro') return
    setRegistroCargando(true)
    setRegistroError('')
    obtenerSuspensiones({
      estado: registroEstado === 'historial' ? 'historial' : 'activas',
      sucursalId: esMaster && registroSucursal !== 'todas' ? Number(registroSucursal) : undefined,
    })
      .then(setRegistro)
      .catch((e) => setRegistroError(e instanceof Error ? e.message : 'No se pudo cargar el registro.'))
      .finally(() => setRegistroCargando(false))
  }, [vista, registroEstado, registroSucursal, esMaster])

  const nombreCategoria = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return productos.filter(
      (p) =>
        (q === '' || p.nombre.toLowerCase().includes(q)) &&
        (filtroCategoria === 'todas' || p.categoriaId === Number(filtroCategoria)) &&
        (filtroEstado === 'todos' || p.estado === filtroEstado),
    )
  }, [productos, busqueda, filtroCategoria, filtroEstado])

  const pagina = filtrados.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)
  const conReinicio = (cambiar: (valor: string) => void) => (valor: string) => {
    cambiar(valor)
    setPaginaActual(1)
  }

  const verboSuspender = esMaster ? 'Deshabilitar' : 'Suspender'
  const verboRehabilitar = esMaster ? 'Habilitar' : 'Reactivar'
  const nombreSucursal = esMaster ? sucursales.find((s) => s.id === sucursalId)?.nombre : administrador?.sucursal?.nombre

  // Qué se puede hacer con lo seleccionado, según el rol
  const seleccionados = productos.filter((p) => seleccion.has(p.id))
  const puedeSuspender = (p: ProductoSucursal) =>
    esMaster ? !p.deshabilitadoGlobal && !p.deshabilitadoEnSucursal : p.estado === 'disponible' || p.estado === 'sin-stock'
  const paraSuspender = individual ? [individual] : seleccionados.filter(puedeSuspender)
  const paraRehabilitar = seleccionados.filter((p) => p.puedeRehabilitar)
  // El master puede estar levantando una suspensión que puso el encargado
  const delEncargado = esMaster ? paraRehabilitar.filter((p) => p.suspension).length : 0

  const todosMarcados = filtrados.length > 0 && filtrados.every((p) => seleccion.has(p.id))
  const alternar = (id: number) =>
    setSeleccion((actual) => {
      const nueva = new Set(actual)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })
  const alternarFiltrados = () =>
    setSeleccion((actual) => {
      const nueva = new Set(actual)
      for (const p of filtrados) {
        if (todosMarcados) nueva.delete(p.id)
        else nueva.add(p.id)
      }
      return nueva
    })

  const cambiarSucursal = (valor: string) => {
    setSucursalId(Number(valor))
    setSeleccion(new Set())
    setPaginaActual(1)
  }

  const cerrarDialogo = () => {
    setDialogo(null)
    setIndividual(null)
  }

  const abrirDialogo = (tipo: 'suspender' | 'rehabilitar') => {
    setMotivo(tipo === 'suspender' ? motivoSugerido : '')
    setErrorMotivo('')
    setDialogo(tipo)
  }

  const confirmar = async () => {
    if (sucursalId == null || dialogo === null) return
    if (dialogo === 'suspender' && !esMaster && motivo.trim().length < 5) {
      setErrorMotivo('Contá brevemente el motivo (al menos 5 caracteres).')
      return
    }
    setEnviando(true)
    try {
      if (dialogo === 'suspender') {
        const r = await suspenderProductos(sucursalId, paraSuspender.map((p) => p.id), motivo.trim())
        mostrarToast(esMaster ? `${cantidad(r.suspendidos, 'producto deshabilitado', 'productos deshabilitados')}` : `${cantidad(r.suspendidos, 'producto suspendido', 'productos suspendidos')}`)
      } else {
        const r = await rehabilitarProductos(sucursalId, paraRehabilitar.map((p) => p.id))
        mostrarToast(esMaster ? `${cantidad(r.rehabilitados, 'producto habilitado', 'productos habilitados')}` : `${cantidad(r.rehabilitados, 'producto rehabilitado', 'productos rehabilitados')}`)
      }
      cerrarDialogo()
      setSeleccion(new Set())
      await cargar()
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo completar la acción')
    } finally {
      setEnviando(false)
    }
  }

  const detalle = (p: ProductoSucursal) => {
    if (p.deshabilitadoGlobal) return 'Deshabilitado en todas las sucursales por la administración'
    if (p.deshabilitadoEnSucursal) return `${p.deshabilitadoEnSucursal.motivo} · ${haceCuanto(p.deshabilitadoEnSucursal.desde)}`
    if (p.suspension) {
      return `${p.suspension.motivo} · ${p.suspension.por?.nombre ?? 'Sin dato'} · ${haceCuanto(p.suspension.desde)}`
    }
    if (p.sinStock) return 'Falta algún insumo en esta sucursal'
    return ''
  }

  async function verStock(p: ProductoSucursal) {
    try {
      setStockVisto(await verStockProducto(p.id))
    } catch (e) {
      mostrarToast(e instanceof Error ? e.message : 'No se pudo cargar el stock')
    }
  }

  const lineaDeStock = stockVisto?.sucursales.find((s) => s.id === sucursalId) ?? null

  // Botones de cada fila: ver el stock del producto en esta sucursal y suspenderlo (el master lo deshabilita)
  const accionesDeFila = (p: ProductoSucursal) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => verStock(p)}
        aria-label={`Ver stock de ${p.nombre}`}
        title="Ver stock en esta sucursal"
        className="rounded border bg-orange-100 p-2 text-action transition-colors hover:text-action-hover"
      >
        <Boxes size={18} />
      </button>
      {puedeSuspender(p) && (
        <button
          type="button"
          onClick={() => {
            setIndividual(p)
            abrirDialogo('suspender')
          }}
          aria-label={`${verboSuspender} ${p.nombre}`}
          title={verboSuspender}
          className="rounded border bg-red-200 p-2 text-danger transition-colors hover:text-danger-hover"
        >
          <Ban size={18} />
        </button>
      )}
    </div>
  )

  const etiquetaEstado = (p: ProductoSucursal) => (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${ESTILO_ESTADO[p.estado].clase}`}>{ESTILO_ESTADO[p.estado].texto}</span>
  )

  const casilla = (p: ProductoSucursal) => (
    <input type="checkbox" checked={seleccion.has(p.id)} onChange={() => alternar(p.id)} aria-label={`Seleccionar ${p.nombre}`} className="h-4 w-4" />
  )

  const tabClase = (activa: boolean) =>
    `rounded border px-4 py-2 font-medium ${activa ? 'bg-action text-white' : 'bg-white hover:bg-gray-100'}`

  if (!esMaster && sucursalId == null) {
    return (
      <main className="p-8">
        <h1 className="mb-4 text-3xl font-bold">Productos</h1>
        <p className="text-gray-600">No tenés una sucursal asignada. Pedile al administrador general que te asigne una.</p>
      </main>
    )
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Disponibilidad</p>
        <h1 className="text-2xl font-bold break-words sm:text-3xl">
          {esMaster ? 'Disponibilidad por sucursal' : 'Productos de mi sucursal'}
        </h1>
        <p className="mt-2 text-gray-600">
          {esMaster
            ? 'Deshabilitá productos en una sucursal, sin plazo, y habilitá de nuevo lo que el encargado haya suspendido.'
            : 'Suspender frena la venta de un producto en tu sucursal hasta que lo rehabilites. Queda registrado el motivo, quién y cuándo.'}
        </p>
      </div>

      <div className="mb-5 flex gap-2">
        <button type="button" onClick={() => setVista('productos')} className={tabClase(vista === 'productos')}>
          Productos
        </button>
        <button type="button" onClick={() => setVista('registro')} className={tabClase(vista === 'registro')}>
          Registro de suspensiones
        </button>
      </div>

      {vista === 'productos' && (
        <>
          <BarraFiltros>
            {esMaster && (
              <SelectFiltro
                valor={sucursalId == null ? '' : String(sucursalId)}
                onChange={cambiarSucursal}
                etiqueta="Sucursal"
                opciones={sucursales.map((s) => ({ valor: String(s.id), etiqueta: s.nombre }))}
              />
            )}
            <Buscador valor={busqueda} onChange={conReinicio(setBusqueda)} placeholder="Buscar producto..." />
            <SelectFiltro
              valor={filtroCategoria}
              onChange={conReinicio(setFiltroCategoria)}
              etiqueta="Filtrar por categoría"
              opciones={[
                { valor: 'todas', etiqueta: 'Todas las categorías' },
                ...categorias.map((c) => ({ valor: String(c.id), etiqueta: c.nombre })),
              ]}
            />
            <SelectFiltro
              valor={filtroEstado}
              onChange={conReinicio(setFiltroEstado)}
              etiqueta="Filtrar por estado"
              opciones={[
                { valor: 'todos', etiqueta: 'Todos los estados' },
                { valor: 'disponible', etiqueta: 'Disponibles' },
                { valor: 'sin-stock', etiqueta: 'Sin stock' },
                { valor: 'suspendido', etiqueta: 'Suspendidos' },
                ...(esMaster ? [{ valor: 'deshabilitado', etiqueta: 'Deshabilitados' }] : []),
              ]}
            />
          </BarraFiltros>

          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={alternarFiltrados} disabled={filtrados.length === 0} className={`${botonAccion} bg-white hover:bg-gray-100`}>
              {todosMarcados ? 'Quitar los resultados' : `Seleccionar los ${filtrados.length} resultados`}
            </button>
            <button type="button" onClick={() => abrirDialogo('suspender')} disabled={paraSuspender.length === 0} className={`${botonAccion} border-red-300 bg-red-50 text-red-700 hover:bg-red-100`}>
              <Ban size={16} /> {verboSuspender} ({paraSuspender.length})
            </button>
            <button type="button" onClick={() => abrirDialogo('rehabilitar')} disabled={paraRehabilitar.length === 0} className={`${botonAccion} border-green-300 bg-green-50 text-green-700 hover:bg-green-100`}>
              <RotateCcw size={16} /> {verboRehabilitar} ({paraRehabilitar.length})
            </button>
            {seleccion.size > 0 && (
              <button type="button" onClick={() => setSeleccion(new Set())} className="text-sm text-gray-600 underline">
                Limpiar selección ({seleccion.size})
              </button>
            )}
          </div>

          {error && <p className="mb-4 text-red-600">{error}</p>}
          {cargando && productos.length === 0 && <p className="text-gray-600">Cargando...</p>}

          {!cargando && !error && pagina.length === 0 ? (
            <div className="rounded-lg border bg-white px-6 py-10">
              <MensajeVacio mensaje="No hay productos con esos filtros." />
            </div>
          ) : (
            pagina.length > 0 && (
              <>
                <ul className="flex flex-col gap-3 md:hidden">
                  {pagina.map((p) => (
                    <li key={p.id} className="flex items-start gap-3 rounded-lg border bg-white p-4">
                      {casilla(p)}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.nombre}</p>
                        <p className="text-sm text-gray-500">{nombreCategoria.get(p.categoriaId ?? -1) ?? 'Sin categoría'}</p>
                        <div className="mt-1">{etiquetaEstado(p)}</div>
                        {detalle(p) && <p className="mt-1 text-sm text-gray-600">{detalle(p)}</p>}
                        <div className="mt-2">{accionesDeFila(p)}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="hidden rounded-lg border bg-white md:block">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="w-12 px-6 py-3 text-left">
                          <input type="checkbox" checked={todosMarcados} onChange={alternarFiltrados} aria-label="Seleccionar todos los resultados" className="h-4 w-4" />
                        </th>
                        <th className="px-6 py-3 text-left">Producto</th>
                        <th className="px-6 py-3 text-left">Categoría</th>
                        <th className="px-6 py-3 text-left">Estado</th>
                        <th className="px-6 py-3 text-left">Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagina.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-6 py-4">{casilla(p)}</td>
                          <td className="px-6 py-4 font-medium">{p.nombre}</td>
                          <td className="px-6 py-4">{nombreCategoria.get(p.categoriaId ?? -1) ?? 'Sin categoría'}</td>
                          <td className="px-6 py-4">{etiquetaEstado(p)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 break-words">{detalle(p)}</span>
                              {accionesDeFila(p)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          )}

          <Paginacion paginaActual={paginaActual} totalElementos={filtrados.length} elementosPorPagina={POR_PAGINA} cambiarPagina={setPaginaActual} />
        </>
      )}

      {vista === 'registro' && (
        <>
          <BarraFiltros>
            <SelectFiltro
              valor={registroEstado}
              onChange={setRegistroEstado}
              etiqueta="Estado del registro"
              opciones={[
                { valor: 'activas', etiqueta: 'Activas' },
                { valor: 'historial', etiqueta: 'Historial' },
              ]}
            />
            {esMaster && (
              <SelectFiltro
                valor={registroSucursal}
                onChange={setRegistroSucursal}
                etiqueta="Sucursal"
                opciones={[
                  { valor: 'todas', etiqueta: 'Todas las sucursales' },
                  ...sucursales.map((s) => ({ valor: String(s.id), etiqueta: s.nombre })),
                ]}
              />
            )}
          </BarraFiltros>

          {registroError && <p className="mb-4 text-red-600">{registroError}</p>}
          {registroCargando && <p className="text-gray-600">Cargando...</p>}

          {!registroCargando && !registroError && registro.length === 0 ? (
            <div className="rounded-lg border bg-white px-6 py-10">
              <MensajeVacio mensaje={registroEstado === 'activas' ? 'No hay suspensiones activas.' : 'Todavía no hay suspensiones registradas.'} />
            </div>
          ) : (
            registro.length > 0 && (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      {esMaster && <th className="px-4 py-3 text-left">Sucursal</th>}
                      <th className="px-4 py-3 text-left">Origen</th>
                      <th className="px-4 py-3 text-left">Motivo</th>
                      <th className="px-4 py-3 text-left">Desde</th>
                      <th className="px-4 py-3 text-left">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registro.map((s) => (
                      <tr key={s.id} className="border-t align-top">
                        <td className="px-4 py-3 font-medium">{s.producto?.nombre ?? 'Producto eliminado'}</td>
                        {esMaster && <td className="px-4 py-3">{s.sucursal?.nombre ?? '-'}</td>}
                        <td className="px-4 py-3">{s.origen === 'MASTER' ? 'Administración' : 'Encargado'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{s.motivo}</td>
                        <td className="px-4 py-3 text-sm" title={fechaCorta(s.desde)}>
                          {haceCuanto(s.desde)}
                          <span className="block text-gray-500">{s.creadaPor?.nombre ?? 'Sin dato'}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {s.rehabilitadaEn ? (
                            <>
                              <span className="font-medium text-green-700">Levantada</span>
                              <span className="block text-gray-500">
                                {fechaCorta(s.rehabilitadaEn)} · {s.rehabilitadaPor?.nombre ?? 'Sin dato'}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium text-red-700">Activa</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </>
      )}

      {dialogo === 'suspender' && (
        <Dialogo titulo={`${verboSuspender} ${cantidad(paraSuspender.length, 'producto', 'productos')}`}>
          <p className="mb-3 text-gray-600">
            {esMaster
              ? `Dejan de venderse en ${nombreSucursal ?? 'la sucursal'} hasta que los habilites de nuevo.`
              : `Dejan de venderse en ${nombreSucursal ?? 'tu sucursal'} hasta que los rehabilites.`}
          </p>
          <label className="mb-1 block font-medium" htmlFor="motivo-suspension">
            Motivo{esMaster ? ' (opcional)' : ''}
          </label>
          <textarea
            id="motivo-suspension"
            value={motivo}
            onChange={(e) => {
              setMotivo(e.target.value)
              setErrorMotivo('')
            }}
            maxLength={200}
            rows={3}
            placeholder={esMaster ? 'Ej: no se vende en esta sucursal' : 'Ej: se rompió la máquina de café'}
            className="w-full rounded border p-2"
          />
          <p className="text-right text-xs text-gray-500">{motivo.length}/200</p>
          {errorMotivo && <p className="mt-1 text-sm text-red-600">{errorMotivo}</p>}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={cerrarDialogo} disabled={enviando} className="rounded border px-4 py-2">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} disabled={enviando} className="rounded border border-black bg-danger px-4 py-2 text-white hover:bg-danger-hover disabled:opacity-50">
              {enviando ? 'Guardando...' : verboSuspender}
            </button>
          </div>
        </Dialogo>
      )}

      {dialogo === 'rehabilitar' && (
        <Dialogo titulo={`${verboRehabilitar} ${cantidad(paraRehabilitar.length, 'producto', 'productos')}`}>
          <p className="text-gray-600">
            Vuelven a venderse en {nombreSucursal ?? 'la sucursal'} (si tienen stock). Queda registrado quién y cuándo.
          </p>
          {delEncargado > 0 && (
            <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-800">
              {delEncargado === 1
                ? '1 producto tiene una suspensión del encargado'
                : `${delEncargado} productos tienen una suspensión del encargado`}
              . Se levanta igual, y queda registrado que lo hiciste vos.
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={cerrarDialogo} disabled={enviando} className="rounded border px-4 py-2">
              Cancelar
            </button>
            <button type="button" onClick={confirmar} disabled={enviando} className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50">
              {enviando ? 'Guardando...' : verboRehabilitar}
            </button>
          </div>
        </Dialogo>
      )}

      {stockVisto && (
        <Dialogo titulo={`Stock de ${stockVisto.nombre}`}>
          <p className="mb-4 text-sm text-gray-600">
            En {nombreSucursal ?? 'la sucursal'}: cuántas unidades se pueden preparar con el stock actual.
          </p>
          {stockVisto.sinReceta ? (
            <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              Este producto no tiene receta, así que no descuenta stock.
            </p>
          ) : lineaDeStock ? (
            lineaDeStock.unidades && lineaDeStock.unidades > 0 ? (
              <p className="text-lg font-bold text-green-700">{lineaDeStock.unidades} unidades</p>
            ) : (
              <p className="font-semibold text-red-700">
                Sin stock
                {lineaDeStock.limitante && <span className="block font-normal text-gray-500">Falta {lineaDeStock.limitante}</span>}
              </p>
            )
          ) : (
            <p className="text-gray-600">No hay datos de stock para esta sucursal.</p>
          )}
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={() => setStockVisto(null)} className="rounded border px-4 py-2 font-semibold hover:bg-gray-50">
              Cerrar
            </button>
          </div>
        </Dialogo>
      )}
    </main>
  )
}
