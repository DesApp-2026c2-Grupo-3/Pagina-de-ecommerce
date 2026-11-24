import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import MensajeVacio from '../../components/MensajeVacio'
import AvisoColaPedidos from '../../components/pedidos/AvisoColaPedidos'
import BarraFiltrosPedidos from '../../components/pedidos/BarraFiltrosPedidos'
import ListaPedidos from '../../components/pedidos/ListaPedidos'
import { DURACION_CONFIRMACION_RAPIDA_MS, POR_PAGINA_PEDIDOS } from '../../config/pedidos'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useCambioEtapaPedido } from '../../hooks/pedidos/useCambioEtapaPedido'
import { useColaIngresoPedidos } from '../../hooks/pedidos/useColaIngresoPedidos'
import { useFiltrosPedidosUrl } from '../../hooks/pedidos/useFiltrosPedidosUrl'
import { usePedidosSucursal } from '../../hooks/pedidos/usePedidosSucursal'
import { usePedidoDeepLink } from '../../hooks/usePedidoDeepLink'
import { usePedidosEnTiempoReal } from '../../hooks/usePedidosEnTiempoReal'
import { obtenerSucursales } from '../../services/sucursalService'
import type { PedidoFila, SucursalOpcion } from '../../types/pedido.types'
import { coincideBusqueda, coincideEtapa, contarPorEtapa } from '../../utils/pedidos/filtrarPedidos'
import { siguienteEtapaRapida } from '../../utils/pedidos/resumenPedido'

// Lista de pedidos de una sucursal (plan responsivo de Pedidos). Solo compone:
// datos (usePedidosSucursal), filtros en la URL, cola de ingreso con cooldown y acción rápida.
export default function Pedidos() {
  const { administrador } = useAuth()
  const { mostrarToast } = useToast()
  const location = useLocation()
  const esMaster = administrador?.rol === 'MASTER'
  const { redirigiendo } = usePedidoDeepLink()
  const filtros = useFiltrosPedidosUrl()

  // El master elige la sucursal (por defecto, la primera); el admin de sucursal ve la suya
  const [sucursales, setSucursales] = useState<SucursalOpcion[]>([])
  const [sucursalesListas, setSucursalesListas] = useState(!esMaster)
  const [errorSucursales, setErrorSucursales] = useState('')
  useEffect(() => {
    if (!esMaster) return
    obtenerSucursales()
      .then((lista: SucursalOpcion[]) => setSucursales(lista))
      .catch(() => setErrorSucursales('No se pudieron cargar las sucursales'))
      .finally(() => setSucursalesListas(true))
  }, [esMaster])

  const sucursalId = esMaster
    ? (filtros.sucursal ?? sucursales[0]?.id ?? null)
    : (administrador?.sucursalId ?? null)

  const datos = usePedidosSucursal(sucursalId)
  const { guardandoId, errores, cambiarEtapa } = useCambioEtapaPedido()

  // Acción rápida en dos pasos (RN-23: no hay vuelta atrás): el primer clic arma, el segundo aplica
  const [armadoId, setArmadoId] = useState<number | null>(null)
  useEffect(() => {
    if (armadoId === null) return
    const timer = window.setTimeout(() => setArmadoId(null), DURACION_CONFIRMACION_RAPIDA_MS)
    return () => window.clearTimeout(timer)
  }, [armadoId])

  const coincide = useCallback(
    (pedido: PedidoFila) =>
      coincideBusqueda(pedido, filtros.busqueda) && coincideEtapa(pedido, filtros.etapa),
    [filtros.busqueda, filtros.etapa],
  )

  const visibles = datos.estadoCola.visibles
  const filtrados = visibles.filter(coincide)
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA_PEDIDOS))
  // Si se cancelan o filtran pedidos y la página queda fuera de rango, se muestra la última válida
  const pagina = Math.min(filtros.pagina, totalPaginas)
  const paginaPedidos = filtrados.slice((pagina - 1) * POR_PAGINA_PEDIDOS, pagina * POR_PAGINA_PEDIDOS)

  const cola = useColaIngresoPedidos({
    estadoCola: datos.estadoCola,
    setEstadoCola: datos.setEstadoCola,
    coincide,
    pausado: datos.cargando || guardandoId !== null || armadoId !== null || pagina > 1,
  })

  usePedidosEnTiempoReal({
    sucursalId,
    pausado: guardandoId !== null || datos.cargando,
    onRefrescar: () => datos.recargar(),
  })

  const nombreSucursal = esMaster
    ? sucursales.find((s) => s.id === sucursalId)?.nombre
    : administrador?.sucursal?.nombre

  async function accionRapida(pedido: PedidoFila) {
    const destino = siguienteEtapaRapida(pedido.estado)
    if (!destino) return
    if (armadoId !== pedido.id) {
      setArmadoId(pedido.id)
      return
    }
    setArmadoId(null)
    const nuevo = await cambiarEtapa(pedido.id, destino)
    if (nuevo) {
      datos.actualizarLocal(pedido.id, { estado: nuevo })
      mostrarToast('Estado del pedido actualizado')
    } else {
      // Rechazado (otro lo cambió, o no se permite): se muestra lo que dice el servidor
      void datos.recargar()
    }
  }

  if (redirigiendo) return <p className="p-8 text-gray-600">Abriendo el pedido...</p>

  const error = errorSucursales || datos.errorCarga

  return (
    <main className="@container w-full max-w-full overflow-hidden p-4 @3xl:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Gestión de pedidos</p>
        <h1 className="text-2xl font-bold @3xl:text-3xl">Pedidos</h1>
        <p className="mt-2 text-gray-600">
          {nombreSucursal
            ? `Seguimiento de los pedidos de ${nombreSucursal}.`
            : 'Seguimiento de los pedidos de la sucursal.'}
        </p>
      </div>

      {!esMaster && sucursalId === null ? (
        <div className="rounded-lg border bg-white px-6 py-10">
          <MensajeVacio mensaje="No tenés una sucursal asignada. Pedile al administrador general que te asigne una." />
        </div>
      ) : (
        <>
          <BarraFiltrosPedidos
            sucursales={esMaster ? sucursales : null}
            sucursalId={sucursalId}
            onSucursal={filtros.setSucursal}
            busqueda={filtros.busqueda}
            onBusqueda={filtros.setBusqueda}
            etapa={filtros.etapa}
            onEtapa={filtros.setEtapa}
            contadores={contarPorEtapa(visibles, filtros.busqueda)}
          />

          {error && (
            <div role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <AvisoColaPedidos
            enCola={cola.enCola}
            enOtraPagina={pagina > 1}
            onMostrar={cola.liberarTodo}
            onIrPrimera={() => filtros.setPagina(1)}
          />
          <p className="sr-only" aria-live="polite">
            {cola.anuncio}
          </p>

          {/* Siempre montado: si la lista se vacía con el puntero encima, la pausa igual se libera */}
          <div {...cola.propsInteraccion}>
            <ListaPedidos
              cargando={datos.cargando || !sucursalesListas}
              pedidos={paginaPedidos}
              totalFiltrados={filtrados.length}
              hayFiltros={filtros.hayFiltros}
              pagina={pagina}
              porPagina={POR_PAGINA_PEDIDOS}
              onPagina={filtros.setPagina}
              resaltados={cola.resaltados}
              armadoId={armadoId}
              guardandoId={guardandoId}
              errores={errores}
              sucursalEnlace={esMaster ? sucursalId : null}
              estadoNavegacion={{ desde: `${location.pathname}${location.search}` }}
              onAccionRapida={(pedido) => void accionRapida(pedido)}
            />
          </div>
        </>
      )}
    </main>
  )
}
