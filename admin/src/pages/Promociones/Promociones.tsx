import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import FiltrosPromociones from '../../components/promociones/FiltrosPromociones'
import PromocionCard from '../../components/promociones/PromocionCard'
import { POR_PAGINA_PROMOCIONES } from '../../config/promociones'
import { useFiltrosPromociones } from '../../hooks/promociones/useFiltrosPromociones'
import { usePromociones } from '../../hooks/promociones/usePromociones'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { PromocionAdmin } from '../../types/promocion.types'
import { paginar } from '../../utils/listas/paginar'
import { contarPorEstadoPromo, contarPorTipo, filtrarPromociones } from '../../utils/promociones/filtrarPromociones'

// Promociones (solo MASTER), sin tabla (plan responsivo de Promociones v2). Solo compone: datos y acciones
// (usePromociones), filtros con menú propio en la URL, fila‑tarjetas, paginación de 10 y la confirmación.
export default function Promociones() {
  const navigate = useNavigate()
  const datos = usePromociones()
  const filtros = useFiltrosPromociones()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [aEliminar, setAEliminar] = useState<PromocionAdmin | null>(null)

  const filtradas = filtrarPromociones(datos.promociones, filtros)
  const { pagina, totalPaginas, items } = paginar(filtradas, filtros.pagina, POR_PAGINA_PROMOCIONES)

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Ofertas de la tienda</p>
          <h1 className="text-2xl font-bold @3xl:text-3xl">Promociones</h1>
          <p className="mt-2 text-gray-600">
            Armá las promos que se ven en la sección Promos de la tienda. Hay un producto y un regalo de la semana
            activos a la vez, y un máximo de promos activas por día.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin/promociones/nueva')}
          aria-label="Nueva promoción"
          title="Nueva promoción"
          className="shrink-0 rounded-full border border-orange-400 bg-action p-4 text-white shadow-[0_0_10px_rgba(249,115,22,0.6)] transition-all hover:bg-action-hover hover:shadow-[0_0_16px_rgba(249,115,22,0.8)]"
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      <FiltrosPromociones
        busqueda={filtros.busqueda}
        onBusqueda={filtros.setBusqueda}
        tipo={filtros.tipo}
        onTipo={filtros.setTipo}
        contadoresTipo={contarPorTipo(datos.promociones, filtros)}
        estado={filtros.estado}
        onEstado={filtros.setEstado}
        contadoresEstado={contarPorEstadoPromo(datos.promociones, filtros)}
      />

      {datos.error && (
        <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {datos.error}
        </p>
      )}

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Promociones, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio
            mensaje={filtros.hayFiltros ? 'No hay promociones con esos filtros.' : 'Todavía no hay promociones cargadas.'}
          />
        </div>
      ) : (
        <ul aria-label="Promociones" className="flex flex-col gap-2.5">
          {items.map((p) => (
            <PromocionCard
              key={p.id}
              promo={p}
              onEditar={(x) => navigate(`/admin/promociones/editar/${x.id}`)}
              onCambiarEstado={(x) => void datos.cambiarEstado(x)}
              onEliminar={setAEliminar}
            />
          ))}
        </ul>
      )}

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        titulo="Eliminar promoción"
        textoConfirmar="Eliminar"
        mensaje={`¿Eliminar la promoción "${aEliminar?.titulo ?? ''}"? Deja de verse en la tienda y en este panel, y no se puede deshacer. Los pedidos y reportes anteriores la siguen mostrando. Si solo querés pausarla, usá "Deshabilitar".`}
        onConfirmar={() => {
          if (aEliminar) void datos.eliminar(aEliminar)
          setAEliminar(null)
        }}
        onCancelar={() => setAEliminar(null)}
      />

      <Paginacion
        paginaActual={pagina}
        totalElementos={filtradas.length}
        elementosPorPagina={POR_PAGINA_PROMOCIONES}
        cambiarPagina={(nueva) => {
          filtros.setPagina(nueva)
          irAlInicio()
        }}
      />
    </main>
  )
}
