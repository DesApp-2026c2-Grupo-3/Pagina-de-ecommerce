import { MinusCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import PestanasStock from '../../components/stock/PestanasStock'
import VistaInsumos from '../../components/stock/VistaInsumos'
import VistaMovimientos from '../../components/stock/VistaMovimientos'
import AlertaStockBajo from '../../components/stock/modales/AlertaStockBajo'
import ModalAumentarStock from '../../components/stock/modales/ModalAumentarStock'
import ModalMinimoStock from '../../components/stock/modales/ModalMinimoStock'
import { useToast } from '../../context/ToastContext'
import { useBloquearScroll } from '../../hooks/useBloquearScroll'
import { useStockEnTiempoReal } from '../../hooks/useStockEnTiempoReal'
import { useFiltrosInsumos } from '../../hooks/stock/useFiltrosInsumos'
import { useStockSucursal } from '../../hooks/stock/useStockSucursal'
import { useVistaStock } from '../../hooks/stock/useVistaStock'
import { cargarAumento, definirMinimo } from '../../services/stockService'
import type { ItemStock } from '../../types/stock.types'
import { rutaReportarBaja, rutaStock } from '../../utils/navegacion/rutasStock'
import { enAlerta } from '../../utils/stock/estadoInsumo'

// Lo que trae la vuelta desde «Reportar baja» (página propia, D-S3)
interface EstadoVueltaBaja {
  desdeBaja?: boolean
  alertaBaja?: ItemStock[]
}

// Stock de una sucursal (plan responsivo de Stock v3). Solo compone:
// datos + tiempo real, pestañas Insumos / Movimientos, y los modales chicos de aumentar y mínimo.
export default function StockSucursal() {
  const { id } = useParams()
  const sucursalId = Number(id)
  const { mostrarToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const vista = useVistaStock()

  const vuelta = location.state as EstadoVueltaBaja | null
  // Si la baja recién registrada hizo cruzar el mínimo, se avisa en el momento (RN-11)
  const [alerta, setAlerta] = useState<ItemStock[]>(() => vuelta?.alertaBaja ?? [])
  const volvioDeBajaRef = useRef(Boolean(vuelta?.desdeBaja))
  const hayDeepLinkRef = useRef<() => boolean>(() => false)

  // El estado de la vuelta se consume una sola vez (recargar la página no repite la alerta)
  useEffect(() => {
    if (!(location.state as EstadoVueltaBaja | null)?.desdeBaja) return
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  // Al entrar: alerta con los insumos en riesgo, salvo que se haya entrado por un aviso
  // o volviendo de una baja (ahí ya se avisó lo que cambió)
  const alCargar = useCallback((datos: ItemStock[]) => {
    if (hayDeepLinkRef.current() || volvioDeBajaRef.current) return
    const enRiesgo = datos.filter(enAlerta)
    if (enRiesgo.length > 0) setAlerta(enRiesgo)
  }, [])

  const datos = useStockSucursal(sucursalId, alCargar)
  const filtros = useFiltrosInsumos({
    sucursalId,
    stock: datos.stock,
    stockCargadoPara: datos.stockCargadoPara,
    onAlerta: setAlerta,
  })
  useEffect(() => {
    hayDeepLinkRef.current = filtros.hayDeepLink
  }, [filtros.hayDeepLink])

  const [aAumentar, setAAumentar] = useState<ItemStock | null>(null)
  const [aDefinirMinimo, setADefinirMinimo] = useState<ItemStock | null>(null)
  const editando = aAumentar !== null || aDefinirMinimo !== null
  useBloquearScroll(alerta.length > 0 || editando)

  useStockEnTiempoReal({
    sucursalId,
    pausado: editando,
    onRefrescar: async () => {
      await datos.recargar()
    },
  })

  async function confirmarAumento(cantidad: number) {
    if (!aAumentar) return
    try {
      await cargarAumento(aAumentar.id, cantidad)
      await datos.recargar()
      setAAumentar(null)
      mostrarToast('Stock actualizado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al cargar stock')
    }
  }

  async function guardarMinimo(minimo: number | null) {
    if (!aDefinirMinimo) return
    try {
      await definirMinimo(aDefinirMinimo.id, minimo)
      await datos.recargar()
      setADefinirMinimo(null)
      mostrarToast(minimo === null ? 'Alerta desactivada' : 'Mínimo actualizado!')
    } catch (error) {
      mostrarToast(error instanceof Error ? error.message : 'Error al definir el mínimo')
    }
  }

  function verEnLista() {
    filtros.mostrarEnAlerta(alerta)
    setAlerta([])
    if (vista !== 'insumos') navigate(rutaStock(sucursalId))
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex flex-col gap-4 @xl:flex-row @xl:items-end @xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Control de inventario por sucursal</p>
          <h1 className="text-2xl font-bold @3xl:text-3xl">Stock</h1>
          <p className="mt-2 text-gray-600">{datos.sucursal ? datos.sucursal.nombre : 'Cargando sucursal...'}</p>
        </div>
        <Link
          to={rutaReportarBaja(sucursalId)}
          state={{ desde: `${location.pathname}${location.search}` }}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-danger px-4 font-semibold text-white hover:bg-danger-hover @xl:w-fit"
        >
          <MinusCircle size={18} aria-hidden="true" /> Reportar baja
        </Link>
      </div>

      <PestanasStock sucursalId={sucursalId} activa={vista} />

      {datos.error && (
        <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {datos.error}
        </div>
      )}

      {vista === 'insumos' ? (
        <VistaInsumos
          stock={datos.stock}
          cargando={datos.cargando}
          filtros={filtros}
          onDefinirMinimo={setADefinirMinimo}
          onAumentar={setAAumentar}
        />
      ) : (
        <VistaMovimientos movimientos={datos.movimientos} cargando={datos.cargando} />
      )}

      {alerta.length > 0 && <AlertaStockBajo items={alerta} onCerrar={() => setAlerta([])} onVerEnLista={verEnLista} />}

      {aAumentar && (
        <ModalAumentarStock
          item={aAumentar}
          onCancelar={() => setAAumentar(null)}
          onConfirmar={confirmarAumento}
          onInvalido={mostrarToast}
        />
      )}

      {aDefinirMinimo && (
        <ModalMinimoStock
          item={aDefinirMinimo}
          onCancelar={() => setADefinirMinimo(null)}
          onGuardar={guardarMinimo}
          onInvalido={mostrarToast}
        />
      )}
    </main>
  )
}
