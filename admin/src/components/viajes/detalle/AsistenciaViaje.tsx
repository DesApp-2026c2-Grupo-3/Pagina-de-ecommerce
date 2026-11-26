import { AlertTriangle, MapPin } from 'lucide-react'
import type { RespuestaReasignacion, Viaje } from '../../../types/viaje.types'
import { formatearHora, nombreRepartidor } from '../../../utils/viajes/resumenViaje'
import ReasignacionViaje from './ReasignacionViaje'

interface Props {
  viaje: Viaje
  onReasignado: (respuesta: RespuestaReasignacion) => void
  onDesactualizado: () => void
}

// Lo que pidió el repartidor y cómo resolverlo (RN-43: el aviso lleva acá, #asistencia)
export default function AsistenciaViaje({ viaje, onReasignado, onDesactualizado }: Props) {
  const hayUbicacion = viaje.latitudAsistencia != null && viaje.longitudAsistencia != null
  const mapa = `https://www.google.com/maps?q=${encodeURIComponent(`${viaje.latitudAsistencia},${viaje.longitudAsistencia}`)}`

  return (
    <section
      id="asistencia"
      aria-labelledby="titulo-asistencia"
      className="scroll-mt-4 rounded-xl border-2 border-red-400 bg-white p-4 @3xl:p-5"
    >
      <h2 id="titulo-asistencia" className="flex items-center gap-2 text-lg font-bold text-red-800">
        <AlertTriangle size={20} aria-hidden="true" /> Requiere asistencia
      </h2>
      <p className="mt-1 text-sm text-gray-600">
        Pedida {viaje.fechaSolicitudAsistencia ? `a las ${formatearHora(viaje.fechaSolicitudAsistencia)}` : '(hora no disponible)'} por{' '}
        {nombreRepartidor(viaje)}.
      </p>

      <dl className="mt-3 grid gap-3 @xl:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Motivo</dt>
          <dd className="mt-0.5 font-semibold text-gray-900">{viaje.motivoAsistencia || 'Sin motivo indicado'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">Comentario</dt>
          <dd className="mt-0.5 text-gray-800">{viaje.comentarioAsistencia || 'El repartidor no agregó comentarios.'}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-gray-50 p-3">
        <MapPin size={18} aria-hidden="true" className="text-gray-600" />
        <span className="min-w-0 flex-1 text-sm text-gray-700">
          {hayUbicacion ? 'Ubicación guardada al pedir ayuda.' : 'No hay una ubicación registrada.'}
        </span>
        {hayUbicacion && (
          <a
            href={mapa}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
          >
            Ver en el mapa <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        )}
      </div>

      <div className="mt-4 border-t border-gray-200 pt-4">
        <ReasignacionViaje
          viajeId={viaje.id}
          repartidorActual={nombreRepartidor(viaje)}
          onHecho={onReasignado}
          onDesactualizado={onDesactualizado}
        />
      </div>
    </section>
  )
}
