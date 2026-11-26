import MensajeVacio from '../MensajeVacio'
import Paginacion from '../Paginacion'
import type { Viaje } from '../../types/viaje.types'
import { rutaDetalleViaje } from '../../utils/navegacion/rutasViaje'
import ViajeCard from './ViajeCard'

interface Props {
  cargando: boolean
  viajes: Viaje[]
  totalFiltrados: number
  hayFiltros: boolean
  pagina: number
  porPagina: number
  onPagina: (pagina: number) => void
  resaltados: number[]
  // Sucursal para el enlace al detalle (solo el MASTER)
  sucursalEnlace: number | null
  estadoNavegacion: { desde: string }
}

export default function ListaViajes({
  cargando,
  viajes,
  totalFiltrados,
  hayFiltros,
  pagina,
  porPagina,
  onPagina,
  resaltados,
  sucursalEnlace,
  estadoNavegacion,
}: Props) {
  if (cargando) return <p className="text-gray-600">Cargando viajes...</p>

  if (viajes.length === 0) {
    return (
      <div className="rounded-lg border bg-white px-6 py-10">
        <MensajeVacio
          mensaje={hayFiltros ? 'No hay viajes con esos filtros.' : 'Todavía no hay viajes en esta sucursal.'}
        />
      </div>
    )
  }

  return (
    <>
      <ul aria-label="Viajes" className="flex w-full flex-col gap-2.5">
        {viajes.map((viaje) => (
          <ViajeCard
            key={viaje.id}
            viaje={viaje}
            recienLlegado={resaltados.includes(viaje.id)}
            enlaceDetalle={rutaDetalleViaje(viaje.id, sucursalEnlace)}
            estadoNavegacion={estadoNavegacion}
          />
        ))}
      </ul>
      <Paginacion
        paginaActual={pagina}
        totalElementos={totalFiltrados}
        elementosPorPagina={porPagina}
        cambiarPagina={onPagina}
      />
    </>
  )
}
