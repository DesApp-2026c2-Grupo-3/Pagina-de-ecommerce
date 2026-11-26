import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import BarraFiltrosLista from '../../components/listas/BarraFiltrosLista'
import RepartidorCard from '../../components/repartidores/RepartidorCard'
import { POR_PAGINA_REPARTIDORES } from '../../config/repartidores'
import { useAuth } from '../../context/AuthContext'
import { useFiltrosRepartidores } from '../../hooks/repartidores/useFiltrosRepartidores'
import { useRepartidores } from '../../hooks/repartidores/useRepartidores'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { Repartidor } from '../../types/repartidor.types'
import { paginar } from '../../utils/listas/paginar'
import type { FiltroEstadoRepartidor } from '../../utils/repartidores/estadoRepartidor'
import {
  contarPorEstadoRepartidor,
  filtrarRepartidores,
  sucursalesDeLaLista,
} from '../../utils/repartidores/filtrarRepartidores'

const OPCIONES_ESTADO: { valor: FiltroEstadoRepartidor; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activos', etiqueta: 'Activos' },
  { valor: 'inactivos', etiqueta: 'Inactivos' },
  { valor: 'enViaje', etiqueta: 'En viaje' },
]

// Repartidores sin tabla (plan responsivo de Repartidores v2). Solo compone:
// datos y acciones (useRepartidores), filtros, fila‑tarjetas, paginación de 10 y confirmaciones.
// El admin de sucursal no ve el filtro de sucursal: el backend ya le devuelve solo los suyos (RN-35).
export default function Repartidores() {
  const navigate = useNavigate()
  const { administrador } = useAuth()
  const esMaster = administrador?.rol === 'MASTER'
  const datos = useRepartidores()
  const filtros = useFiltrosRepartidores()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()

  const [aDesactivar, setADesactivar] = useState<Repartidor | null>(null)
  const [aDarDeBaja, setADarDeBaja] = useState<Repartidor | null>(null)

  const filtrados = filtrarRepartidores(datos.repartidores, filtros)
  const { pagina, totalPaginas, items } = paginar(filtrados, filtros.pagina, POR_PAGINA_REPARTIDORES)
  const sucursales = esMaster
    ? sucursalesDeLaLista(datos.repartidores).map((s) => ({ ...s, activa: true }))
    : null

  async function confirmarDesactivar() {
    if (aDesactivar) await datos.desactivar(aDesactivar)
    setADesactivar(null)
  }

  async function confirmarBaja() {
    if (aDarDeBaja) await datos.darDeBaja(aDarDeBaja)
    setADarDeBaja(null)
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Gestión de personal</p>
          <h1 className="break-words text-2xl font-bold @3xl:text-3xl">Repartidores</h1>
          <p className="mt-2 text-gray-600">
            {esMaster
              ? 'Repartidores de todas las sucursales.'
              : `Repartidores de ${administrador?.sucursal?.nombre ?? 'tu sucursal'}.`}
          </p>
        </div>

        {/* D-R4: el círculo con «+» de siempre */}
        <button
          type="button"
          onClick={() => navigate('/admin/repartidores/nuevo')}
          aria-label="Nuevo repartidor"
          title="Nuevo repartidor"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      <BarraFiltrosLista<FiltroEstadoRepartidor>
        sucursales={sucursales}
        sucursalId={filtros.sucursalId}
        onSucursal={filtros.setSucursalId}
        sucursalTodas={{ etiqueta: 'Todas las sucursales', onElegir: () => filtros.setSucursalId(null) }}
        busqueda={filtros.busqueda}
        onBusqueda={filtros.setBusqueda}
        placeholder="Buscar por nombre o email"
        filtro={{
          id: 'filtro-estado-repartidor',
          leyenda: 'Filtrar repartidores por estado',
          opciones: OPCIONES_ESTADO,
          valor: filtros.estado,
          contadores: contarPorEstadoRepartidor(datos.repartidores, filtros),
          onChange: filtros.setEstado,
        }}
      />

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Repartidores, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando repartidores...</p>
      ) : datos.error ? (
        <p role="alert" className="rounded-lg border border-red-300 bg-red-50 px-6 py-10 text-center text-red-700">
          {datos.error}
        </p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={filtros.hayFiltros ? 'No hay repartidores con esos filtros.' : 'No hay repartidores registrados.'}
          />
        </div>
      ) : (
        <ul aria-label="Repartidores" className="flex flex-col gap-2.5">
          {items.map((r) => (
            <RepartidorCard
              key={r.id}
              repartidor={r}
              mostrarSucursal={esMaster}
              onEditar={(x) => navigate(`/admin/repartidores/editar/${x.id}`)}
              onDesactivar={setADesactivar}
              onReactivar={(x) => void datos.reactivar(x)}
              onDarDeBaja={setADarDeBaja}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA_REPARTIDORES}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />

      <ConfirmarEliminacion
        abierto={aDesactivar !== null}
        mensaje={`¿Seguro que querés desactivar a ${aDesactivar?.nombre ?? 'este repartidor'}?`}
        onConfirmar={() => void confirmarDesactivar()}
        onCancelar={() => setADesactivar(null)}
      />

      <ConfirmarEliminacion
        abierto={aDarDeBaja !== null}
        titulo="Confirmar baja permanente"
        textoConfirmar="Dar de baja"
        mensaje={`¿Estás seguro de que querés dar de baja permanentemente a ${aDarDeBaja?.nombre ?? 'este repartidor'}? Esta acción no se puede revertir desde el sistema y conservará sus registros históricos.`}
        onConfirmar={() => void confirmarBaja()}
        onCancelar={() => setADarDeBaja(null)}
      />
    </main>
  )
}
