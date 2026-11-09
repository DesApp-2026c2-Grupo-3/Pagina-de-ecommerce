import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MinusCircle, TriangleAlert } from 'lucide-react'
import MensajeVacio from '../../components/MensajeVacio'
import { BarraFiltros, Buscador, SelectFiltro } from '../../components/Filtros'
import StockMovimientos from '../../components/stock/StockMovimientos'
import StockTabla from '../../components/stock/StockTabla'
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
import { useStockEnTiempoReal } from '../../hooks/useStockEnTiempoReal'
import { useStockDeepLink } from '../../hooks/useStockDeepLink'
import Paginacion from '../../components/Paginacion'
import { filtrarStock } from '../../utils/stock/filtrarStock'
import type { ItemStock, Movimiento } from '../../types/stock.types'

// Un insumo está "en alerta" si se quedó sin stock o llegó a su mínimo
const enAlerta = (item: ItemStock) => item.activo && (item.cantidad <= 0 || item.bajoMinimo)

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
  const {
    nombreBuscado: nombreDeepLink,
    claveNavegacion,
    limpiarBusqueda,
  } = useStockDeepLink()

  const [sucursal, setSucursal] = useState<{ nombre: string } | null>(null)
  const [stock, setStock] = useState<ItemStock[]>([])
  const [stockCargadoPara, setStockCargadoPara] = useState<number | null>(null)
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [alerta, setAlerta] = useState<ItemStock[]>([])

  const [paginaActual, setPaginaActual] = useState(1)
  const POR_PAGINA = 10

  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroTipo, setFiltroTipo] = useState('todos')

  const [insumoResaltadoId, setInsumoResaltadoId] = useState<number | null>(null)
  const [insumoObjetivoId, setInsumoObjetivoId] = useState<number | null>(null)
  const aplicacionRef = useRef<string | null>(null)
  const nombreDeepLinkRef = useRef(nombreDeepLink)
  const nombreAnteriorRef = useRef<string | null>(null)
  const limpiezaManualRef = useRef(false)

  nombreDeepLinkRef.current = nombreDeepLink

  useEffect(() => {
    if (nombreDeepLink === null) {
      const veniaDeDeepLink = nombreAnteriorRef.current !== null
      const fueLimpiezaManual = limpiezaManualRef.current

      nombreAnteriorRef.current = null
      limpiezaManualRef.current = false
      aplicacionRef.current = null
      setInsumoObjetivoId(null)
      setInsumoResaltadoId(null)

      if (veniaDeDeepLink && !fueLimpiezaManual) {
        setBusqueda('')
        setFiltroEstado('todos')
        setPaginaActual(1)

        const enRiesgo = stock.filter(enAlerta)
        if (enRiesgo.length > 0) setAlerta(enRiesgo)
      }

      return
    }

    nombreAnteriorRef.current = nombreDeepLink

    if (stockCargadoPara !== sucursalId) return
    if (aplicacionRef.current === claveNavegacion) return

    const item = stock.find(
      (dato) => dato.nombre.trim() === nombreDeepLink,
    )

    if (!item) {
      aplicacionRef.current = claveNavegacion
      limpiarBusqueda()
      return
    }

    aplicacionRef.current = claveNavegacion
    setBusqueda(item.nombre)
    setFiltroEstado('todos')
    setInsumoObjetivoId(item.id)
    setPaginaActual(1)
    setInsumoResaltadoId(item.id)
    setAlerta([])
  }, [
    claveNavegacion,
    limpiarBusqueda,
    nombreDeepLink,
    stock,
    stockCargadoPara,
    sucursalId,
  ])

  useEffect(() => {
    if (insumoResaltadoId === null) return

    const timer = window.setTimeout(() => setInsumoResaltadoId(null), 4000)
    return () => window.clearTimeout(timer)
  }, [insumoResaltadoId])

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

  async function recargar(): Promise<ItemStock[]> {
    const [datosStock, datosMovimientos] = await Promise.all([
      obtenerStockPorSucursal(sucursalId),
      obtenerMovimientos(sucursalId),
    ])
    setStock(datosStock)
    setStockCargadoPara(sucursalId)
    setMovimientos(datosMovimientos)
    return datosStock
  }

useEffect(() => {
  setInsumoObjetivoId(null)
  setInsumoResaltadoId(null)
  aplicacionRef.current = null

  obtenerSucursalPorId(sucursalId)
    .then(setSucursal)
    .catch(() => setSucursal(null))

recargar()
  .then((datos) => {
    if (nombreDeepLinkRef.current !== null) return

    const enRiesgo = datos.filter(enAlerta)

    if (enRiesgo.length > 0) {
      setAlerta(enRiesgo)
    }
  })
  .catch((error) => console.error('Error al cargar stock:', error))
}, [id])

  const editando =
    aAumentar !== null || aDefinirMinimo !== null || reportandoBaja

  useStockEnTiempoReal({
    sucursalId,
    pausado: editando,
    onRefrescar: async () => {
      await recargar()
    },
  })

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

  function liberarDeepLink() {
    if (nombreDeepLink !== null) {
      limpiezaManualRef.current = true
      limpiarBusqueda()
    }

    setInsumoObjetivoId(null)
    setInsumoResaltadoId(null)
  }

  function cambiarBusqueda(valor: string) {
    setBusqueda(valor)
    liberarDeepLink()
  }

  function cambiarFiltroEstado(valor: string) {
    setFiltroEstado(valor)
    liberarDeepLink()
  }

  const stockFiltrado = filtrarStock({
    items: stock,
    busqueda,
    filtroEstado,
    objetivoId: insumoObjetivoId,
  })

  const stockPaginado = stockFiltrado.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  )

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">
            Control de inventario por sucursal
          </p>
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
        <Buscador valor={busqueda} onChange={cambiarBusqueda} placeholder="Buscar insumo..." />
        <SelectFiltro
          valor={filtroEstado}
          onChange={cambiarFiltroEstado}
          etiqueta="Filtrar por estado"
          opciones={[
            { valor: 'todos', etiqueta: 'Todos los estados' },
            { valor: 'bajo', etiqueta: 'Stock bajo' },
            { valor: 'sin', etiqueta: 'Sin stock' },
            { valor: 'deshabilitado', etiqueta: 'Deshabilitado' },
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
        <StockTabla
          items={stockPaginado}
          resaltadoId={insumoResaltadoId}
          onDefinirMinimo={(item) => {
            setADefinirMinimo(item)
            setValorMinimo(
              item.stockMinimo != null ? String(item.stockMinimo) : '',
            )
          }}
          onAumentar={(item) => {
            setAAumentar(item)
            setCantidadAumento('')
          }}
        />
      )}

      <StockMovimientos
        movimientos={movimientos}
        filtroTipo={filtroTipo}
        onCambiarFiltro={setFiltroTipo}
      />

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
                  liberarDeepLink()
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

      <Paginacion
      paginaActual={paginaActual}
      totalElementos={stockFiltrado.length}
      elementosPorPagina={POR_PAGINA}
      cambiarPagina={setPaginaActual}
      />
    </main>
  )
}