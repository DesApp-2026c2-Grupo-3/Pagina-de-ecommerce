import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Viaje } from '../../types/viaje.types'
import { formatearPrecio } from '../../utils/pedidos/resumenPedido'
import { clasesEstadoViaje, etiquetaEstadoViaje, requiereAsistencia, tonoDeViaje } from '../../utils/viajes/estadoViaje'
import { nombreRepartidor, notaDeViaje, textoInicio, textoPedidos, totalViaje } from '../../utils/viajes/resumenViaje'
import EnlaceDetalle from '../listas/EnlaceDetalle'
import EstadoBadge from '../listas/EstadoBadge'
import NotaSinAccion from '../listas/NotaSinAccion'
import TarjetaFila from '../listas/TarjetaFila'

interface Props {
  viaje: Viaje
  // Llegó en la última actualización: ámbar + «Nuevo» unos segundos
  recienLlegado: boolean
  enlaceDetalle: string
  estadoNavegacion: { desde: string }
}

// Tarjeta de un viaje sobre la fila compartida con Pedidos. Sin botón para avanzar el estado:
// el viaje lo mueve el repartidor (RN-31). Lo único que hace el admin es atender una asistencia.
export default function ViajeCard({ viaje, recienLlegado, enlaceDetalle, estadoNavegacion }: Props) {
  const nota = notaDeViaje(viaje)
  const dadoDeBaja = Boolean(viaje.Repartidor?.deletedAt)

  return (
    <TarjetaFila
      identificador={{ principal: `Viaje #${viaje.id}`, secundario: textoInicio(viaje) }}
      titulo={nombreRepartidor(viaje)}
      extras={
        dadoDeBaja && (
          // RN-52: el viaje se conserva aunque el repartidor ya no esté
          <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
            Dado de baja
          </span>
        )
      }
      subtitulo={textoPedidos(viaje)}
      importe={formatearPrecio(totalViaje(viaje))}
      estado={<EstadoBadge texto={etiquetaEstadoViaje(viaje.estado)} clases={clasesEstadoViaje(viaje.estado)} />}
      tono={tonoDeViaje(viaje, recienLlegado)}
      acciones={
        <>
          {requiereAsistencia(viaje) ? (
            // RN-43: lleva a donde se resuelve (la sección de asistencia del detalle)
            <Link
              to={`${enlaceDetalle}#asistencia`}
              state={estadoNavegacion}
              aria-label={`Atender la asistencia del viaje ${viaje.id}`}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-red-700 px-3 text-sm font-bold text-white hover:bg-red-800 @xl:min-h-9 @xl:flex-none"
            >
              <AlertTriangle size={15} aria-hidden="true" /> Atender asistencia
            </Link>
          ) : (
            nota && <NotaSinAccion texto={nota.texto} icono={nota.icono} />
          )}
          <EnlaceDetalle to={enlaceDetalle} estado={estadoNavegacion} etiqueta={`Ver detalle del viaje ${viaje.id}`} />
        </>
      }
    />
  )
}
