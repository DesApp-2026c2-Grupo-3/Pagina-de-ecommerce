import type { RefObject } from 'react'
import type { Viaje } from '../../../types/viaje.types'
import { clasesEstadoViaje, etiquetaEstadoViaje } from '../../../utils/viajes/estadoViaje'
import EstadoBadge from '../../listas/EstadoBadge'

// «Viaje #512» + estado. Recibe el foco al abrir para que el lector de pantalla lo anuncie.
export default function EncabezadoViaje({
  viaje,
  nombreSucursal,
  refTitulo,
}: {
  viaje: Viaje
  nombreSucursal?: string
  refTitulo: RefObject<HTMLHeadingElement | null>
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 ref={refTitulo} tabIndex={-1} className="text-2xl font-extrabold text-gray-900 outline-none @3xl:text-3xl">
          Viaje #{viaje.id}
        </h1>
        <EstadoBadge texto={etiquetaEstadoViaje(viaje.estado)} clases={clasesEstadoViaje(viaje.estado)} tamano="md" />
      </div>
      {nombreSucursal && <p className="text-sm text-gray-600">{nombreSucursal}</p>}
    </div>
  )
}
