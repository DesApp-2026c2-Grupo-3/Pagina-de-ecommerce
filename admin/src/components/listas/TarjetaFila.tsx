import type { ReactNode } from 'react'
import type { TonoTarjeta } from '../../types/viaje.types'

interface Props {
  // «#18332» + «24/11/26, 5:55 p. m.» · «Viaje #512» + «Inicio 14:20»
  identificador: { principal: string; secundario: string }
  titulo: string
  // Pastillas junto al título (p. ej. «Dado de baja»). «Nuevo» la agrega la tarjeta según el tono.
  extras?: ReactNode
  subtitulo: string
  importe: string
  estado: ReactNode
  acciones: ReactNode
  tono: TonoTarjeta
  error?: string
}

const TONOS: Record<TonoTarjeta, string> = {
  normal: 'border-gray-200',
  nuevo: 'border-amber-400 ring-2 ring-amber-200 motion-safe:animate-ingreso-pedido',
  alerta: 'border-red-400 ring-2 ring-red-200',
}

// Fila compacta compartida por Pedidos y Viajes (planes responsivos). Container queries:
// móvil = 4 líneas · tablet (@xl) = 2 líneas · escritorio (@5xl) = 1 fila.
// Columnas de ancho fijo y ubicación explícita (sin row-span/col-span) para que todas
// las tarjetas queden alineadas aunque cambie el largo de las acciones.
export default function TarjetaFila({
  identificador,
  titulo,
  extras,
  subtitulo,
  importe,
  estado,
  acciones,
  tono,
  error,
}: Props) {
  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-lg border-2 bg-white px-3 py-3 @xl:grid-cols-[9rem_minmax(0,1fr)_6rem_10.5rem] @xl:px-4 @5xl:grid-cols-[9rem_minmax(0,1fr)_6rem_10.5rem_17rem] @5xl:gap-x-4 @5xl:py-2.5 ${TONOS[tono]}`}
    >
      <p className="col-start-1 row-start-1 text-sm @xl:flex @xl:flex-col @5xl:row-start-1 @5xl:row-end-3">
        <span className="whitespace-nowrap font-extrabold text-gray-900">{identificador.principal}</span>
        <span className="whitespace-nowrap text-gray-600"><span className="@xl:hidden"> · </span>{identificador.secundario}</span>
      </p>

      <div className="col-start-2 row-start-1 justify-self-end @xl:col-start-4 @5xl:row-start-1 @5xl:row-end-3 @5xl:justify-self-start">
        {estado}
      </div>

      <p className="col-start-1 row-start-2 flex min-w-0 items-center gap-2 @xl:col-start-2 @xl:row-start-1 @5xl:self-end">
        <span className="truncate font-bold text-gray-800">{titulo}</span>
        {tono === 'nuevo' && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800">
            Nuevo
          </span>
        )}
        {extras}
      </p>

      <p className="col-start-2 row-start-2 justify-self-end whitespace-nowrap font-extrabold text-gray-900 @xl:col-start-3 @xl:row-start-1 @5xl:row-start-1 @5xl:row-end-3">
        {importe}
      </p>

      <p
        title={subtitulo}
        className="col-start-1 col-end-3 row-start-3 min-w-0 text-sm text-gray-600 @xl:col-end-3 @xl:row-start-2 @xl:truncate @5xl:col-start-2 @5xl:col-end-3 @5xl:self-start"
      >
        {subtitulo}
      </p>

      <div className="col-start-1 col-end-3 row-start-4 mt-1 flex items-center gap-2 @xl:col-start-3 @xl:col-end-5 @xl:row-start-2 @xl:mt-0 @xl:justify-end @5xl:col-start-5 @5xl:col-end-6 @5xl:row-start-1 @5xl:row-end-3">
        {acciones}
      </div>

      {error && (
        <p role="alert" className="col-span-full rounded border border-red-300 bg-red-50 px-2 py-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </li>
  )
}
