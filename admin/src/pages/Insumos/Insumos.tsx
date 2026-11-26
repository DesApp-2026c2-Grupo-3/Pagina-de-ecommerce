import { useState, type ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import MensajeVacio from '../../components/MensajeVacio'
import Paginacion from '../../components/Paginacion'
import FormularioInsumo from '../../components/insumos/FormularioInsumo'
import InsumoCatalogoCard from '../../components/insumos/InsumoCatalogoCard'
import FiltroSegmentado from '../../components/listas/FiltroSegmentado'
import { POR_PAGINA_INSUMOS } from '../../config/insumos'
import { useFiltrosListaInsumos } from '../../hooks/insumos/useFiltrosListaInsumos'
import { useFormularioInsumo } from '../../hooks/insumos/useFormularioInsumo'
import { useInsumos } from '../../hooks/insumos/useInsumos'
import { useIrAlInicioLista } from '../../hooks/useIrAlInicioLista'
import type { Insumo } from '../../types/insumo.types'
import {
  contarPorEstadoInsumo,
  filtrarInsumos,
  mensajeSinInsumos,
  type FiltroEstadoInsumo,
} from '../../utils/insumos/filtrarInsumos'
import { paginar } from '../../utils/listas/paginar'

const OPCIONES_ESTADO: { valor: FiltroEstadoInsumo; etiqueta: string }[] = [
  { valor: 'habilitados', etiqueta: 'Habilitados' },
  { valor: 'deshabilitados', etiqueta: 'Deshabilitados' },
]

// Insumos del catálogo, sin tabla (plan responsivo de Insumos v3). Solo compone: formulario de
// crear / editar a lo ancho, filtros en la URL, fila‑tarjetas, paginación de 10 y la confirmación de baja.
export default function Insumos() {
  const [error, setError] = useState('')
  const datos = useInsumos(setError)
  const formulario = useFormularioInsumo(setError, datos.cargar)
  const filtros = useFiltrosListaInsumos()
  const { refTitulo, irAlInicio } = useIrAlInicioLista()
  const [aEliminar, setAEliminar] = useState<Insumo | null>(null)

  const filtrados = filtrarInsumos(datos.insumos, filtros)
  const { pagina, totalPaginas, items } = paginar(filtrados, filtros.pagina, POR_PAGINA_INSUMOS)

  async function confirmarEliminacion() {
    if (aEliminar) await datos.eliminar(aEliminar)
    setAEliminar(null)
  }

  return (
    <main className="@container w-full max-w-full p-4 @3xl:p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-700">Gestión de inventario</p>
      <h1 className="text-2xl font-bold @3xl:text-3xl">Insumos</h1>
      <p className="mt-2 text-gray-600">
        Los ingredientes con los que se arman las recetas. Al crear uno, se agrega con stock 0 en todas las sucursales.
      </p>

      <FormularioInsumo
        form={formulario.form}
        editando={formulario.editandoId !== null}
        guardando={formulario.guardando}
        error={error}
        refFormulario={formulario.refFormulario}
        refNombre={formulario.refNombre}
        onCambiar={formulario.cambiar}
        onGuardar={(e) => void formulario.guardar(e)}
        onCancelar={formulario.cancelar}
      />

      {/* Buscador y dos botones fijos del mismo tamaño (sin desplegable) */}
      <div className="mb-4 mt-6 flex flex-col gap-3 @[48rem]:flex-row @[48rem]:items-center">
        <div className="relative w-full @[48rem]:w-96 @[48rem]:flex-none">
          <Search
            size={18}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <label htmlFor="filtro-insumos-buscar" className="sr-only">
            Buscar insumo
          </label>
          <input
            id="filtro-insumos-buscar"
            type="search"
            value={filtros.busqueda}
            onChange={(e: ChangeEvent<HTMLInputElement>) => filtros.setBusqueda(e.target.value)}
            placeholder="Buscar insumo..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
          />
        </div>
        <FiltroSegmentado<FiltroEstadoInsumo>
          id="filtro-insumos"
          leyenda="Filtrar insumos por estado"
          opciones={OPCIONES_ESTADO}
          valor={filtros.estado}
          contadores={contarPorEstadoInsumo(datos.insumos, filtros.busqueda)}
          onChange={filtros.setEstado}
          variante="botones"
          distribucion="iguales"
        />
      </div>

      <h2 ref={refTitulo} tabIndex={-1} className="sr-only">
        Insumos, página {pagina} de {totalPaginas}
      </h2>

      {datos.cargando ? (
        <p className="rounded-lg border border-gray-200 bg-white px-6 py-10 text-center text-gray-600">Cargando insumos...</p>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white px-6 py-10">
          <MensajeVacio mensaje={mensajeSinInsumos(datos.insumos.length, filtros.busqueda)} />
        </div>
      ) : (
        <ul aria-label="Insumos" className="flex flex-col gap-2.5">
          {items.map((insumo) => (
            <InsumoCatalogoCard
              key={insumo.id}
              insumo={insumo}
              editando={formulario.editandoId === insumo.id}
              onEditar={formulario.editar}
              onCambiarEstado={(x) => void datos.cambiarEstado(x)}
              onEliminar={setAEliminar}
            />
          ))}
        </ul>
      )}

      {filtrados.length > 0 && (
        <Paginacion
          paginaActual={pagina}
          totalElementos={filtrados.length}
          elementosPorPagina={POR_PAGINA_INSUMOS}
          cambiarPagina={(nueva) => {
            filtros.setPagina(nueva)
            irAlInicio()
          }}
        />
      )}

      <ConfirmarEliminacion
        abierto={aEliminar !== null}
        titulo="Eliminar insumo"
        textoConfirmar="Eliminar"
        mensaje={`¿Eliminar ${aEliminar?.nombre ?? 'este insumo'}? Deja de verse en este panel y en el stock de las sucursales, y no se puede deshacer. El historial de movimientos lo sigue mostrando. Si solo querés dejar de reponerlo, usá "Deshabilitar": se sigue usando hasta agotar el stock.`}
        onConfirmar={() => void confirmarEliminacion()}
        onCancelar={() => setAEliminar(null)}
      />
    </main>
  )
}
