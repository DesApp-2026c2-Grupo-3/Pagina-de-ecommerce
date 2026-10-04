import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, MinusCircle } from 'lucide-react'
import MensajeVacio from '../../components/MensajeVacio'
import { obtenerSucursalPorId } from '../../services/sucursalService'
import {
  obtenerStockPorSucursal,
  obtenerMovimientos,
  cargarAumento,
  registrarBaja,
  MOTIVOS_BAJA,
} from '../../services/stockService'
import { useToast } from '../../context/ToastContext'

interface ItemStock {
  id: number
  nombre: string
  unidadMedida: string
  cantidad: number
  bajoMinimo: boolean
}

interface Movimiento {
  id: number
  fecha: string
  tipo: 'aumento' | 'baja'
  insumo: string
  unidadMedida: string
  cantidad: number
  motivo: string | null
  detalle: string | null
  admin: string | null
}

function formatearFechaHora(valor: string) {
  return new Date(valor).toLocaleString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

const etiquetaMotivo = (motivo: string | null) =>
  MOTIVOS_BAJA.find((m) => m.valor === motivo)?.etiqueta ?? '—'

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
const cajaModal = 'w-full max-w-md rounded-lg bg-white p-6 shadow-xl'
const campo = 'w-full rounded border px-3 py-2'

export default function StockSucursal() {
  const { id } = useParams()
  const sucursalId = Number(id)
  const { mostrarToast } = useToast()

  const [sucursal, setSucursal] = useState<{ nombre: string } | null>(null)
  const [stock, setStock] = useState<ItemStock[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])

  // Aumentar
  const [aAumentar, setAAumentar] = useState<ItemStock | null>(null)
  const [cantidadAumento, setCantidadAumento] = useState('')

  // Reportar baja
  const [reportandoBaja, setReportandoBaja] = useState(false)
  const [baja, setBaja] = useState({ stockId: '', cantidad: '', motivo: '', detalle: '' })
  const [errorBaja, setErrorBaja] = useState('')

  async function recargar() {
    const [datosStock, datosMovimientos] = await Promise.all([
      obtenerStockPorSucursal(sucursalId),
      obtenerMovimientos(sucursalId),
    ])
    setStock(datosStock)
    setMovimientos(datosMovimientos)
  }

  useEffect(() => {
    obtenerSucursalPorId(sucursalId)
      .then(setSucursal)
      .catch(() => setSucursal(null))
    recargar().catch((error) => console.error('Error al cargar stock:', error))
  }, [id])

  async function confirmarAumento() {
    if (!aAumentar) return
    const cantidad = Number(cantidadAumento)
    if (!cantidad || cantidad <= 0) {
      mostrarToast('Ingresá una cantidad válida')
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

  async function confirmarBaja() {
    const cantidad = Number(baja.cantidad)
    if (!baja.stockId) return setErrorBaja('Elegí el insumo.')
    if (!cantidad || cantidad <= 0) return setErrorBaja('Ingresá una cantidad válida.')
    if (!baja.motivo) return setErrorBaja('Elegí el motivo de la baja.')
    if (baja.motivo === 'otro' && baja.detalle.trim().length < 5) {
      return setErrorBaja('Contá brevemente el motivo (al menos 5 caracteres).')
    }

    try {
      await registrarBaja(Number(baja.stockId), { cantidad, motivo: baja.motivo, detalle: baja.detalle.trim() })
      await recargar()
      cerrarBaja()
      mostrarToast('Baja registrada!')
    } catch (error) {
      setErrorBaja(error instanceof Error ? error.message : 'No se pudo registrar la baja.')
    }
  }

  function cerrarBaja() {
    setReportandoBaja(false)
    setBaja({ stockId: '', cantidad: '', motivo: '', detalle: '' })
    setErrorBaja('')
  }

  const insumoBaja = stock.find((s) => String(s.id) === baja.stockId)

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
          className="inline-flex w-full justify-center sm:w-fit items-center gap-2 rounded border border-red-300 bg-danger px-4 py-2 font-semibold text-white hover:bg-danger-hover"
        >
          <MinusCircle size={18} /> Reportar baja
        </button>
      </div>

      {/* ---------- Grilla ---------- */}
      {stock.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje="No hay stock registrado para esta sucursal." />
        </div>
      ) : (
        <>
          {/* Celular: una tarjeta por insumo */}
          <ul className="flex flex-col gap-3 md:hidden">
            {stock.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.nombre}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-bold">{item.cantidad.toLocaleString('es-AR')}</span>
                    <Estado item={item} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAAumentar(item)
                    setCantidadAumento('')
                  }}
                  aria-label={`Aumentar ${item.nombre}`}
                  className="shrink-0 rounded border border-orange-300 bg-action p-3 text-white hover:bg-action-hover"
                >
                  <Plus size={18} />
                </button>
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
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-6 py-4 font-medium">{item.nombre}</td>
                    <td className="px-6 py-4">{item.cantidad.toLocaleString('es-AR')}</td>
                    <td className="px-6 py-4">
                      <Estado item={item} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setAAumentar(item)
                          setCantidadAumento('')
                        }}
                        className="inline-flex items-center gap-1 rounded border border-orange-300 bg-action px-3 py-2 text-sm font-semibold text-white hover:bg-action-hover"
                      >
                        <Plus size={16} /> Aumentar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {/* ---------- Historial ---------- */}
      <h2 className="mb-3 mt-10 text-xl font-bold">Últimos movimientos</h2>

      {movimientos.length === 0 ? (
        <p className="rounded-lg border bg-white px-4 py-8 text-center text-gray-500">
          Todavía no hay movimientos registrados.
        </p>
      ) : (
        <>
          {/* Celular: una tarjeta por movimiento */}
          <ul className="flex flex-col gap-3 md:hidden">
            {movimientos.map((m) => (
              <li key={m.id} className="rounded-lg border bg-white p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate font-medium">{m.insumo}</p>
                  <span className={`shrink-0 font-bold ${m.tipo === 'baja' ? 'text-red-700' : 'text-green-700'}`}>
                    {m.tipo === 'baja' ? '−' : '+'}
                    {m.cantidad.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="mt-1 text-gray-700">
                  {m.tipo === 'baja' ? etiquetaMotivo(m.motivo) : 'Carga de stock'}
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
                {movimientos.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="whitespace-nowrap px-4 py-3">{formatearFechaHora(m.fecha)}</td>
                    <td className="px-4 py-3">{m.insumo}</td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 font-semibold ${
                        m.tipo === 'baja' ? 'text-red-700' : 'text-green-700'
                      }`}
                    >
                      {m.tipo === 'baja' ? '−' : '+'}
                      {m.cantidad.toLocaleString('es-AR')}
                    </td>
                    <td className="px-4 py-3">
                      {m.tipo === 'baja' ? (
                        <>
                          {etiquetaMotivo(m.motivo)}
                          {m.detalle && <span className="block text-gray-500">{m.detalle}</span>}
                        </>
                      ) : (
                        <span className="text-gray-500">Carga de stock</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{m.admin ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
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
              min="0"
              step="0.01"
              autoFocus
              value={cantidadAumento}
              onChange={(e) => setCantidadAumento(e.target.value)}
              className={campo}
              placeholder="Ej: 50"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAAumentar(null)}
                className="rounded border px-4 py-2 font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarAumento}
                className="rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white hover:bg-action-hover"
              >
                Confirmar
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
                      {s.nombre} (hay {s.cantidad.toLocaleString('es-AR')})                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium">Cantidad a bajar</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
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
              <button type="button" onClick={cerrarBaja} className="rounded border px-4 py-2 font-semibold hover:bg-gray-50">
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