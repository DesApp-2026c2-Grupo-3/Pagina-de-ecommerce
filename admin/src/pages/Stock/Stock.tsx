import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Bell, MinusCircle, Plus, TriangleAlert } from 'lucide-react'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import { obtenerSucursalPorId } from '../../services/sucursalService'
import {
  obtenerStockPorSucursal,
  obtenerMovimientos,
  cargarAumento,
  registrarBaja,
  definirMinimo,
  MOTIVOS_BAJA,
} from '../../services/stockService'
import { useToast } from '../../context/ToastContext'

interface ItemStock {
  id: number
  nombre: string
  cantidad: number
  stockMinimo: number | null
  bajoMinimo: boolean
}

interface Movimiento {
  id: number
  fecha: string
  tipo: 'aumento' | 'baja' | 'venta' | 'devolucion'
  insumo: string
  cantidad: number
  motivo: string | null
  detalle: string | null
  admin: string | null
  pedidoId: number | null
}

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const etiquetaMotivo = (motivo: string | null) => MOTIVOS_BAJA.find((m) => m.valor === motivo)?.etiqueta ?? '—'

// Qué se muestra en "Motivo" según el tipo de movimiento
function descripcion(m: Movimiento) {
  if (m.tipo === 'baja') return etiquetaMotivo(m.motivo)
  if (m.tipo === 'venta') return `Venta · pedido #${m.pedidoId}`
  if (m.tipo === 'devolucion') return `Pedido #${m.pedidoId} cancelado`
  return 'Carga de stock'
}

// Las bajas y las ventas restan; los aumentos y las devoluciones suman
const resta = (m: Movimiento) => m.tipo === 'baja' || m.tipo === 'venta'

// Un insumo está "en alerta" si se quedó sin stock o llegó a su mínimo
const enAlerta = (item: ItemStock) => item.cantidad <= 0 || item.bajoMinimo

function Estado({ item }: { item: ItemStock }) {
  if (item.cantidad <= 0) {
    return <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">Sin stock</span>
  }
  if (item.bajoMinimo) {
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">Bajo</span>
  }
  return <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">Normal</span>
}

const fondoModal = 'fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4'
const cajaModal = 'max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 shadow-xl'
const campo = 'w-full rounded border px-3 py-2'
const botonSecundario = 'rounded border px-4 py-2 font-semibold hover:bg-gray-50'
const botonPrincipal =
  'rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white hover:bg-action-hover'

export default function StockSucursal() {
  const { id } = useParams()
  const sucursalId = Number(id)
  const { mostrarToast } = useToast()

  const [sucursal, setSucursal] = useState<{ nombre: string } | null>(null)
  const [stock, setStock] = useState<ItemStock[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  // Aumentar
  const [aAumentar, setAAumentar] = useState<ItemStock | null>(null)
  const [cantidadAumento, setCantidadAumento] = useState('')

  // Mínimo (valor de alerta)
  const [aDefinirMinimo, setADefinirMinimo] = useState<ItemStock | null>(null)
  const [valorMinimo, setValorMinimo] = useState('')

  // Reportar baja
  const [reportandoBaja, setReportandoBaja] = useState(false)
  const [baja, setBaja] = useState({ stockId: '', cantidad: '', motivo: '', detalle: '' })
  const [errorBaja, setErrorBaja] = useState('')

  // Ventana de alerta: insumos en o por debajo del mínimo
  const [alerta, setAlerta] = useState<ItemStock[]>([])

  async function recargar(): Promise<ItemStock[]> {
    const [datosStock, datosMovimientos] = await Promise.all([
      obtenerStockPorSucursal(sucursalId),
      obtenerMovimientos(sucursalId),
    ])
    setStock(datosStock)
    setMovimientos(datosMovimientos)
    return datosStock
  }

  useEffect(() => {
    obtenerSucursalPorId(sucursalId)
      .then(setSucursal)
      .catch(() => setSucursal(null))

    recargar()
      .then((datos) => {
        // La alerta se muestra una sola vez por sesión y por sucursal
        const clave = `alertaStockVista-${sucursalId}`
        const enRiesgo = datos.filter(enAlerta)
        if (enRiesgo.length > 0 && !sessionStorage.getItem(clave)) {
          setAlerta(enRiesgo)
          sessionStorage.setItem(clave, 'si')
        }
      })
      .catch((error) => console.error('Error al cargar stock:', error))
  }, [id])

  async function confirmarAumento() {
    if (!aAumentar) return
    const cantidad = Number(cantidadAumento)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      mostrarToast('Ingresá una cantidad entera mayor a 0')
      return
    }
    try {
      await cargarAumento(aAumentar.id, cantidad)
      await recargar()
      setAAumentar(null)
      setCantidadAumento('')
      mostrarToast('Stock actualizado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al cargar stock')
    }
  }

  async function confirmarMinimo() {
    if (!aDefinirMinimo) return
    const minimo = valorMinimo === '' ? null : Number(valorMinimo)
    if (minimo !== null && (!Number.isInteger(minimo) || minimo < 0)) {
      mostrarToast('El mínimo debe ser un número entero, 0 o más')
      return
    }
    try {
      await definirMinimo(aDefinirMinimo.id, minimo)
      await recargar()
      setADefinirMinimo(null)
      mostrarToast(minimo === null ? 'Alerta desactivada' : 'Mínimo actualizado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al definir el mínimo')
    }
  }

  async function confirmarBaja() {
    const cantidad = Number(baja.cantidad)
    if (!baja.stockId) return setErrorBaja('Elegí el insumo.')
    if (!Number.isInteger(cantidad) || cantidad <= 0) return setErrorBaja('Ingresá una cantidad entera mayor a 0.')
    if (!baja.motivo) return setErrorBaja('Elegí el motivo de la baja.')
    if (baja.motivo === 'otro' && baja.detalle.trim().length < 5) {
      return setErrorBaja('Contá brevemente el motivo (al menos 5 caracteres).')
    }

    const antes = stock.find((s) => String(s.id) === baja.stockId)

    try {
      await registrarBaja(Number(baja.stockId), { cantidad, motivo: baja.motivo, detalle: baja.detalle.trim() })
      const actualizado = await recargar()
      cerrarBaja()
      mostrarToast('Baja registrada!')

      // Si con esta baja el insumo entró en alerta, se avisa en el momento
      const despues = actualizado.find((s) => String(s.id) === baja.stockId)
      if (antes && despues && !enAlerta(antes) && enAlerta(despues)) {
        setAlerta([despues])
      }
    } catch (error) {
      setErrorBaja(error instanceof Error ? error.message : 'No se pudo registrar la baja.')
    }
  }

  function cerrarBaja() {
    setReportandoBaja(false)
    setBaja({ stockId: '', cantidad: '', motivo: '', detalle: '' })
    setErrorBaja('')
  }

  const stockFiltrado = stock.filter(
    (item) =>
      item.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()) &&
      (filtroEstado === 'todos' ||
        (filtroEstado === 'sin' && item.cantidad <= 0) ||
        (filtroEstado === 'bajo' && item.cantidad > 0 && item.bajoMinimo)),
  )
  const movimientosFiltrados = movimientos.filter((m) => filtroTipo === 'todos' || m.tipo === filtroTipo)

  // Botones de cada insumo
  const acciones = (item: ItemStock) => (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => {
          setADefinirMinimo(item)
          setValorMinimo(item.stockMinimo != null ? String(item.stockMinimo) : '')
        }}
        aria-label={`Definir mínimo de ${item.nombre}`}
        title="Definir mínimo (alerta)"
        className="rounded border bg-slate-100 p-2 text-gray-700 hover:text-amber-700"
      >
        <Bell size={18} />
      </button>
      <button
        type="button"
        onClick={() => {
          setAAumentar(item)
          setCantidadAumento('')
        }}
        aria-label={`Aumentar ${item.nombre}`}
        title="Aumentar stock"
        className="inline-flex items-center gap-1 rounded border border-orange-300 bg-action p-2 text-sm font-semibold text-white hover:bg-action-hover md:px-3"
      >
        <Plus size={18} /> <span className="hidden md:inline">Aumentar</span>
      </button>
    </div>
  )

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stock</h1>
          <p className="mt-2 text-gray-600">{sucursal ? sucursal.nombre : 'Cargando sucursal...'}</p>
        </div>
        <button
          type="button"
          onClick={() => setReportandoBaja(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded border border-red-300 bg-danger px-4 py-2 font-semibold text-white hover:bg-danger-hover sm:w-fit"
        >
          <MinusCircle size={18} /> Reportar baja
        </button>
      </div>

      <BarraFiltros>
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar insumo..." />
        <SelectFiltro
          valor={filtroEstado}
          onChange={setFiltroEstado}
          etiqueta="Filtrar por estado"
          opciones={[
            { valor: 'todos', etiqueta: 'Todos los estados' },
            { valor: 'bajo', etiqueta: 'Stock bajo' },
            { valor: 'sin', etiqueta: 'Sin stock' },
          ]}
        />
      </BarraFiltros>

      {/* ---------- Grilla ---------- */}
      {stockFiltrado.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio
            mensaje={stock.length === 0 ? 'No hay stock registrado para esta sucursal.' : 'No hay insumos con esos filtros.'}
          />
        </div>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {stockFiltrado.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.nombre}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold">{item.cantidad.toLocaleString('es-AR')}</span>
                    <Estado item={item} />
                  </div>
                  {item.stockMinimo != null && <p className="mt-1 text-xs text-gray-500">Mínimo: {item.stockMinimo}</p>}
                </div>
                {acciones(item)}
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">Insumo</th>
                  <th className="px-6 py-3 text-left">Cantidad</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{item.nombre}</td>
                    <td className="px-6 py-4">
                      {item.cantidad.toLocaleString('es-AR')}
                      {item.stockMinimo != null && (
                        <span className="ml-2 text-xs text-gray-500">(mín. {item.stockMinimo})</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Estado item={item} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end">{acciones(item)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------- Historial ---------- */}
      <div className="mb-3 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold">Últimos movimientos</h2>
        <SelectFiltro
          valor={filtroTipo}
          onChange={setFiltroTipo}
          etiqueta="Filtrar movimientos"
          opciones={[
            { valor: 'todos', etiqueta: 'Todos los movimientos' },
            { valor: 'aumento', etiqueta: 'Solo aumentos' },
            { valor: 'baja', etiqueta: 'Solo bajas' },
            { valor: 'venta', etiqueta: 'Solo ventas' },
            { valor: 'devolucion', etiqueta: 'Solo devoluciones' },
          ]}
        />
      </div>

      {movimientosFiltrados.length === 0 ? (
        <p className="rounded-lg border bg-white px-4 py-8 text-center text-gray-500">
          {movimientos.length === 0 ? 'Todavía no hay movimientos registrados.' : 'No hay movimientos de ese tipo.'}
        </p>
      ) : (
        <>
          {/* Celular: tarjetas */}
          <ul className="flex flex-col gap-3 md:hidden">
            {movimientosFiltrados.map((m) => (
              <li key={m.id} className="rounded-lg border bg-white p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">{m.insumo}</p>
                  <span className={`shrink-0 font-bold ${resta(m) ? 'text-red-700' : 'text-green-700'}`}>
                    {resta(m) ? '−' : '+'}
                    {m.cantidad.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="mt-1 text-gray-700">
                  {descripcion(m)}
                  {m.detalle && <span className="block text-gray-500">{m.detalle}</span>}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {formatearFechaHora(m.fecha)}
                  {m.admin && ` · ${m.admin}`}
                </p>
              </li>
            ))}
          </ul>

          {/* Escritorio: tabla */}
          <div className="hidden rounded-lg border bg-white md:block">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Insumo</th>
                  <th className="px-4 py-3 text-left">Movimiento</th>
                  <th className="px-4 py-3 text-left">Motivo</th>
                  <th className="px-4 py-3 text-left">Por</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="whitespace-nowrap px-4 py-3">{formatearFechaHora(m.fecha)}</td>
                    <td className="px-4 py-3">{m.insumo}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 font-semibold ${
                        resta(m) ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {resta(m) ? '−' : '+'}
                      {m.cantidad.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      {descripcion(m)}
                      {m.detalle && <span className="block text-gray-500">{m.detalle}</span>}
                    </td>
                    <td className="px-4 py-3">{m.admin ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ---------- Modal: alerta de stock bajo ---------- */}
      {alerta.length > 0 && (
        <div className={fondoModal} role="alertdialog" aria-labelledby="titulo-alerta">
          <div className={cajaModal}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                <TriangleAlert size={22} />
              </span>
              <h2 id="titulo-alerta" className="text-xl font-bold">
                {alerta.length === 1 ? 'Insumo con stock bajo' : `${alerta.length} insumos con stock bajo`}
              </h2>
            </div>
            <p className="mt-2 text-sm text-gray-600">Conviene reponer estos insumos para no quedarse sin productos para vender.</p>

            <ul className="mt-4 flex flex-col divide-y">
              {alerta.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-medium">{item.nombre}</span>
                  <span className={`shrink-0 text-sm font-semibold ${item.cantidad <= 0 ? 'text-red-700' : 'text-amber-700'}`}>
                    {item.cantidad <= 0
                      ? 'Sin stock'
                      : `Quedan ${item.cantidad}${item.stockMinimo != null ? ` (mín. ${item.stockMinimo})` : ''}`}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setAlerta([])} className={botonSecundario}>
                Entendido
              </button>
              <button
                type="button"
                onClick={() => {
                  setBusqueda('')
                  setFiltroEstado(alerta.every((i) => i.cantidad <= 0) ? 'sin' : 'bajo')
                  setAlerta([])
                }}
                className={botonPrincipal}
              >
                Ver en la lista
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal: aumentar ---------- */}
      {aAumentar && (
        <div className={fondoModal}>
          <div className={cajaModal}>
            <h2 className="text-xl font-bold">Aumentar stock</h2>
            <p className="mt-1 text-gray-600">
              {aAumentar.nombre} · hay {aAumentar.cantidad.toLocaleString('es-AR')}
            </p>

            <label className="mt-4 block font-medium">Cantidad a agregar</label>
            <input
              type="number"
              min="1"
              step="1"
              autoFocus
              value={cantidadAumento}
              onChange={(e) => setCantidadAumento(e.target.value)}
              className={campo}
              placeholder="Ej: 50"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAAumentar(null)} className={botonSecundario}>
                Cancelar
              </button>
              <button type="button" onClick={confirmarAumento} className={botonPrincipal}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal: mínimo ---------- */}
      {aDefinirMinimo && (
        <div className={fondoModal}>
          <div className={cajaModal}>
            <h2 className="text-xl font-bold">Stock mínimo</h2>
            <p className="mt-1 text-gray-600">
              {aDefinirMinimo.nombre} · hay {aDefinirMinimo.cantidad.toLocaleString('es-AR')}
            </p>

            <label className="mt-4 block font-medium">Avisar cuando queden</label>
            <input
              type="number"
              min="0"
              step="1"
              autoFocus
              value={valorMinimo}
              onChange={(e) => setValorMinimo(e.target.value)}
              className={campo}
              placeholder="Ej: 10 (vacío = sin alerta)"
            />
            <p className="mt-1 text-sm text-gray-500">Si el stock llega a este número o menos, se muestra una alerta.</p>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setADefinirMinimo(null)} className={botonSecundario}>
                Cancelar
              </button>
              <button type="button" onClick={confirmarMinimo} className={botonPrincipal}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Modal: reportar baja ---------- */}
      {reportandoBaja && (
        <div className={fondoModal}>
          <div className={cajaModal}>
            <h2 className="text-xl font-bold">Reportar baja</h2>
            <p className="mt-1 text-sm text-gray-600">Queda registrada en el historial, con su motivo.</p>

            <div className="mt-4 flex flex-col gap-4">
              <div>
                <label className="block font-medium">Insumo</label>
                <select
                  value={baja.stockId}
                  onChange={(e) => {
                    setBaja({ ...baja, stockId: e.target.value })
                    setErrorBaja('')
                  }}
                  className={campo}
                >
                  <option value="">Elegir insumo</option>
                  {stock.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} (hay {s.cantidad.toLocaleString('es-AR')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium">Cantidad a bajar</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={baja.cantidad}
                  onChange={(e) => {
                    setBaja({ ...baja, cantidad: e.target.value })
                    setErrorBaja('')
                  }}
                  className={campo}
                  placeholder="Ej: 5"
                />
              </div>

              <div>
                <label className="block font-medium">Motivo</label>
                <select
                  value={baja.motivo}
                  onChange={(e) => {
                    setBaja({ ...baja, motivo: e.target.value })
                    setErrorBaja('')
                  }}
                  className={campo}
                >
                  <option value="">Elegir motivo</option>
                  {MOTIVOS_BAJA.map((m) => (
                    <option key={m.valor} value={m.valor}>
                      {m.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium">
                  Detalle {baja.motivo === 'otro' ? '' : <span className="text-gray-500">(opcional)</span>}
                </label>
                <textarea
                  maxLength={200}
                  rows={2}
                  value={baja.detalle}
                  onChange={(e) => {
                    setBaja({ ...baja, detalle: e.target.value })
                    setErrorBaja('')
                  }}
                  className={campo}
                  placeholder="Ej: se cortó la luz y se descongeló el freezer"
                />
              </div>
            </div>

            {errorBaja && <p className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorBaja}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={cerrarBaja} className={botonSecundario}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarBaja}
                className="rounded border border-red-300 bg-danger px-4 py-2 font-semibold text-white hover:bg-danger-hover"
              >
                Registrar baja
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}