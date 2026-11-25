import { Bike } from 'lucide-react'
import type { Viaje } from '../../../types/viaje.types'
import { formatearPrecio } from '../../../utils/pedidos/resumenPedido'
import { formatearHora, nombreRepartidor, notaDeViaje, totalViaje } from '../../../utils/viajes/resumenViaje'
import NotaSinAccion from '../../listas/NotaSinAccion'

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{etiqueta}</dt>
      <dd className="mt-0.5 truncate font-semibold text-gray-900">{valor}</dd>
    </div>
  )
}

// Repartidor, horarios y total. Solo lectura: el estado del viaje lo mueve el repartidor (RN-31).
export default function DatosViaje({ viaje }: { viaje: Viaje }) {
  const nota = notaDeViaje(viaje)
  return (
    <section aria-labelledby="titulo-datos-viaje" className="rounded-xl border border-gray-200 bg-white p-4 @3xl:p-5">
      <h2 id="titulo-datos-viaje" className="mb-3 flex items-center gap-2 font-bold text-gray-900">
        <Bike size={18} aria-hidden="true" /> Repartidor
      </h2>
      <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-900">
        {nombreRepartidor(viaje)}
        {viaje.Repartidor?.deletedAt && (
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-gray-700">
            Dado de baja
          </span>
        )}
      </p>
      <dl className="mt-3 grid grid-cols-2 gap-3 @xl:grid-cols-4">
        <Dato etiqueta="Inicio" valor={viaje.fechaInicio ? formatearHora(viaje.fechaInicio) : 'Sin iniciar'} />
        <Dato etiqueta="Fin" valor={formatearHora(viaje.fechaFin)} />
        <Dato etiqueta="Pedidos" valor={String(viaje.Pedidos?.length ?? 0)} />
        <Dato etiqueta="Total" valor={formatearPrecio(totalViaje(viaje))} />
      </dl>
      {nota && (
        <p className="mt-3 flex border-t border-gray-200 pt-3">
          <NotaSinAccion texto={nota.texto} icono={nota.icono} />
        </p>
      )}
    </section>
  )
}
