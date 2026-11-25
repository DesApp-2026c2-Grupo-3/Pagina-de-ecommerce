import { useCallback, useEffect, useRef } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import EnlaceVolver from '../../components/navegacion/EnlaceVolver'
import ClientePedido from '../../components/pedidos/detalle/ClientePedido'
import EncabezadoDetallePedido from '../../components/pedidos/detalle/EncabezadoDetallePedido'
import EntregaPedido from '../../components/pedidos/detalle/EntregaPedido'
import ObservacionesPedido from '../../components/pedidos/detalle/ObservacionesPedido'
import ProductosPedido from '../../components/pedidos/detalle/ProductosPedido'
import SeguimientoPedido from '../../components/pedidos/detalle/SeguimientoPedido'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCambioEtapaPedido } from '../../hooks/pedidos/useCambioEtapaPedido'
import { usePedidoDetalle } from '../../hooks/pedidos/usePedidoDetalle'
import { usePedidoDetalleEnTiempoReal } from '../../hooks/pedidos/usePedidoDetalleEnTiempoReal'
import type { Etapa } from '../../types/pedido.types'
import { leerIdPositivo } from '../../utils/navegacion/leerIdPositivo'
import { PARAM_SUCURSAL } from '../../utils/navegacion/parametros'
import { destinoVolver, etiquetaVolver } from '../../utils/navegacion/rutasPedido'

// Página propia del detalle y seguimiento de un pedido (plan responsivo, 4.4). Sin modales.
// El acceso lo decide el backend: un pedido de otra sucursal responde 404.
export default function DetallePedido() {
  const { pedidoId: parametro } = useParams()
  const pedidoId = leerIdPositivo(parametro ?? null)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const refTitulo = useRef<HTMLHeadingElement | null>(null)

  const { pedido, carga, error, recargar, reintentar } = usePedidoDetalle(pedidoId)
  const { guardandoId, errores, cambiarEtapa } = useCambioEtapaPedido()
  const guardando = pedidoId !== null && guardandoId === pedidoId

  usePedidoDetalleEnTiempoReal({
    pedidoId,
    sucursalId: pedido?.sucursalId,
    pausado: guardando,
    onRefrescar: recargar,
  })

  // `sucursal` en la URL solo le sirve al MASTER para volver a esa sucursal (RN-35)
  const sucursalVolver =
    administrador?.rol === 'MASTER' ? leerIdPositivo(searchParams.get(PARAM_SUCURSAL)) : null
  const volverA = destinoVolver(location.state, sucursalVolver)

  // Foco y título al abrir: el lector de pantalla anuncia en qué pedido está
  const cargado = carga === 'listo'
  useEffect(() => {
    if (!cargado || pedidoId === null) return
    const anterior = document.title
    document.title = `Pedido #${pedidoId} · Admin`
    refTitulo.current?.focus()
    return () => {
      document.title = anterior
    }
  }, [cargado, pedidoId])

  const onCambiarEtapa = useCallback(
    async (etapa: Etapa) => {
      if (pedidoId === null) return false
      const nuevo = await cambiarEtapa(pedidoId, etapa)
      // Con éxito o con error (409: el repartidor lo retiró), se muestra lo que dice el servidor
      await recargar()
      if (nuevo) mostrarToast('Estado del pedido actualizado')
      return nuevo !== null
    },
    [cambiarEtapa, mostrarToast, pedidoId, recargar],
  )

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Vuelve a la lista de pedidos o al viaje desde el que se abrió */}
        <EnlaceVolver to={volverA} texto={etiquetaVolver(volverA)} />

        {carga === 'cargando' && <p className="text-gray-600">Cargando pedido...</p>}

        {carga === 'no-encontrado' && (
          <div className="rounded-xl border bg-white px-6 py-10 text-center">
            <h1 className="text-xl font-bold text-gray-900">Pedido no encontrado</h1>
            <p className="mt-2 text-gray-600">Puede que no exista o que no corresponda a tu sucursal.</p>
          </div>
        )}

        {carga === 'error' && (
          <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => void reintentar()}
              className="min-h-11 rounded-lg border border-red-300 bg-white px-4 font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        )}

        {pedido && carga === 'listo' && (
          <>
            <EncabezadoDetallePedido pedido={pedido} refTitulo={refTitulo} />
            {error && (
              <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                No se pudo actualizar el detalle: {error}
              </p>
            )}
            {/* En escritorio: contenido a la izquierda y seguimiento a la derecha; si no, el seguimiento va primero */}
            <div className="grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_24rem] @5xl:items-start @5xl:gap-6">
              <div className="@5xl:order-2">
                <SeguimientoPedido
                  pedido={pedido}
                  guardando={guardando}
                  error={pedidoId !== null ? (errores[pedidoId] ?? '') : ''}
                  onCambiarEtapa={onCambiarEtapa}
                />
              </div>
              <div className="flex min-w-0 flex-col gap-4 @5xl:order-1">
                <ObservacionesPedido observaciones={pedido.observaciones} />
                <ProductosPedido
                  DetallePedidos={pedido.DetallePedidos}
                  catalogo={pedido.catalogo}
                  total={pedido.total}
                  costoEnvio={pedido.costoEnvio}
                />
                <div className="grid gap-4 @xl:grid-cols-2">
                  <EntregaPedido direccion={pedido.Direccion} />
                  <ClientePedido usuario={pedido.Usuario} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
