import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import AdministradorCard from '../../components/administradores/AdministradorCard'
import FiltrosAdministradores from '../../components/administradores/FiltrosAdministradores'
import { POR_PAGINA_ADMINISTRADORES } from '../../config/administradores'
import { useAdministradores } from '../../hooks/administradores/useAdministradores'
import { useFiltrosAdministradores } from '../../hooks/administradores/useFiltrosAdministradores'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { AdministradorFila } from '../../types/administrador.types'
import {
  contarPorRol,
  contarPorSucursal,
  filtrarAdministradores,
  sucursalesDeLaLista,
} from '../../utils/administradores/filtrarAdministradores'
import { paginar } from '../../utils/listas/paginar'

// Administradores (solo MASTER), sin tabla (plan responsivo de Administradores v6). Solo compone: datos y acciones
// (useAdministradores), filtros con menú propio en la URL, tarjetas, paginación de hasta 10 y la confirmación.
export default function Administradores() {
  const navigate = useNavigate()
  const datos = useAdministradores()
  const filtros = useFiltrosAdministradores()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [aDesactivar, setADesactivar] = useState<AdministradorFila | null>(null)

  const filtrados = filtrarAdministradores(datos.administradores, filtros)
  const { pagina, totalPaginas, items } = paginar(filtrados, filtros.pagina, POR_PAGINA_ADMINISTRADORES)

  async function confirmarDesactivar() {
    if (aDesactivar) await datos.desactivar(aDesactivar)
    setADesactivar(null)
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Usuarios y permisos</p>
          <h1 className="break-words text-2xl font-bold @3xl:text-3xl">Administradores</h1>
          <p className="mt-2 text-gray-600">Gestión de administradores del sistema.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/administradores/nuevo')}
          aria-label="Nuevo administrador"
          title="Nuevo administrador"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      <FiltrosAdministradores
        busqueda={filtros.busqueda}
        onBusqueda={filtros.setBusqueda}
        rol={filtros.rol}
        onRol={filtros.setRol}
        contadoresRol={contarPorRol(datos.administradores, filtros)}
        sucursal={filtros.sucursal}
        onSucursal={filtros.setSucursal}
        sucursales={sucursalesDeLaLista(datos.administradores)}
        contadoresSucursal={contarPorSucursal(datos.administradores, filtros)}
      />

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Administradores, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando administradores...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={filtros.hayFiltros ? 'No hay administradores con esos filtros.' : 'No hay administradores registrados.'}
          />
        </div>
      ) : (
        <ul aria-label="Administradores" className="flex flex-col gap-2.5">
          {items.map((a) => (
            <AdministradorCard
              key={a.id}
              admin={a}
              onEditar={(x) => navigate(`/admin/administradores/editar/${x.id}`)}
              onDesactivar={setADesactivar}
              onReactivar={(x) => void datos.reactivar(x)}
            />
          ))}
        </ul>
      )}

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtrados.length}
        elementosPorPagina={POR_PAGINA_ADMINISTRADORES}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />

      <ConfirmarEliminacion
        abierto={aDesactivar !== null}
        mensaje={`¿Seguro que querés desactivar a ${aDesactivar?.nombre ?? 'este administrador'}?`}
        onConfirmar={() => void confirmarDesactivar()}
        onCancelar={() => setADesactivar(null)}
      />
    </main>
  )
}
