import { DIAS_SEMANA, type DiaSemana, type HorarioDia, type HorarioSemana } from '../types/sucursal.types'
import { ETIQUETA_DIA } from '../utils/horario'

interface Props {
  horario: HorarioSemana
  onCambiarDia: (dia: DiaSemana, valor: HorarioDia) => void
}

const campoHora = 'w-full rounded border p-2 disabled:bg-gray-100 disabled:text-gray-400'

// Editor de una semana completa: un interruptor y dos horas por día.
// Al cerrar un día se conservan las horas cargadas (solo se deshabilitan).
export default function EditorHorario({ horario, onCambiarDia }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-[8rem_7rem_1fr_1fr] md:items-center md:gap-x-4 md:gap-y-2">
      <div className="hidden md:contents">
        <span className="text-sm font-semibold text-gray-600">Día</span>
        <span className="text-sm font-semibold text-gray-600">Atiende</span>
        <span className="text-sm font-semibold text-gray-600">Apertura</span>
        <span className="text-sm font-semibold text-gray-600">Cierre</span>
      </div>

      {DIAS_SEMANA.map((dia) => {
        const config = horario[dia]
        return (
          <div key={dia} className="grid gap-2 rounded-lg border p-3 md:contents md:border-0 md:p-0">
            <span className="font-medium md:self-center">{ETIQUETA_DIA[dia]}</span>

            <label className="inline-flex cursor-pointer items-center gap-2 md:justify-center">
              <input
                type="checkbox"
                role="switch"
                checked={config.abierto}
                onChange={(e) => onCambiarDia(dia, { ...config, abierto: e.target.checked })}
                aria-label={`Atiende los ${ETIQUETA_DIA[dia].toLowerCase()}`}
                className="peer sr-only"
              />
              <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500" />
              <span className="text-sm text-gray-600 md:hidden">{config.abierto ? 'Abierto' : 'Cerrado'}</span>
            </label>

            <label className="flex items-center gap-2 md:block">
              <span className="w-20 shrink-0 text-sm text-gray-500 md:hidden">Apertura</span>
              <input
                type="time"
                value={config.apertura}
                onChange={(e) => onCambiarDia(dia, { ...config, apertura: e.target.value })}
                disabled={!config.abierto}
                aria-label={`Apertura ${ETIQUETA_DIA[dia].toLowerCase()}`}
                className={campoHora}
              />
            </label>

            <label className="flex items-center gap-2 md:block">
              <span className="w-20 shrink-0 text-sm text-gray-500 md:hidden">Cierre</span>
              <input
                type="time"
                value={config.cierre}
                onChange={(e) => onCambiarDia(dia, { ...config, cierre: e.target.value })}
                disabled={!config.abierto}
                aria-label={`Cierre ${ETIQUETA_DIA[dia].toLowerCase()}`}
                className={campoHora}
              />
            </label>
          </div>
        )
      })}
    </div>
  )
}
