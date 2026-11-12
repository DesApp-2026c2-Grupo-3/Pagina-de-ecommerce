import { Moon } from "lucide-react";
import {
  DIAS_SEMANA,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
} from "../types/sucursal.types";
import {
  ETIQUETA_DIA,
  FIN_DE_DIA,
  aMinutos,
  formatearExceso,
  topeTransnoche,
  validarDia,
} from "../utils/horario";
import MenuReplicar from "./MenuReplicar";

interface Props {
  horario: HorarioSemana;
  onCambiarDia: (dia: DiaSemana, valor: HorarioDia) => void;
}

const campoHora =
  "w-full rounded border p-2 text-sm disabled:bg-gray-100 disabled:text-gray-400";

// 150 -> "02:30" (para el input de hora)
const minutosAHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

// Un día de la semana: abierto o cerrado, apertura, cierre y, si cierra a las 23:59, "Atención Trasnoche"
export default function EditorHorario({ horario, onCambiarDia }: Props) {
  const replicarHorario = (origen: DiaSemana, destinos: DiaSemana[]) => {
    destinos.forEach((destino) => onCambiarDia(destino, { ...horario[origen] }));
  };

  return (
    <div className="flex flex-col gap-4">
      {DIAS_SEMANA.map((dia) => {
        const config = horario[dia];
        const error = validarDia(dia, config, horario);
        const tope = topeTransnoche(horario, dia);
        const conTransnoche = config.transnocheMin != null;
        const claseHora = (invalido: boolean) =>
          `${campoHora} ${invalido ? "border-red-500 bg-red-50" : ""}`;

        const cambiarAbierto = (abierto: boolean) => {
          const nuevo = { ...config, abierto };
          if (!abierto) delete nuevo.transnocheMin; // un día cerrado no tiene transnoche
          onCambiarDia(dia, nuevo);
        };

        // Atención Trasnoche: fija el cierre a las 23:59 y abre el contador de minutos de exceso
        const alternarTransnoche = () => {
          if (conTransnoche) {
            const nuevo = { ...config };
            delete nuevo.transnocheMin;
            onCambiarDia(dia, nuevo);
          } else {
            onCambiarDia(dia, {
              ...config,
              cierre: FIN_DE_DIA,
              transnocheMin: Math.min(60, tope),
            });
          }
        };

        const cambiarExceso = (valor: string) => {
          const minutos = aMinutos(valor);
          if (minutos !== null) onCambiarDia(dia, { ...config, transnocheMin: minutos });
        };

        return (
          <div
            key={dia}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5"
          >
            {/* Cabecera: día + abierto/cerrado */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="text-base font-bold text-gray-800">{ETIQUETA_DIA[dia]}</span>

              <label className="inline-flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  role="switch"
                  checked={config.abierto}
                  onChange={(e) => cambiarAbierto(e.target.checked)}
                  aria-label={`Atiende los ${ETIQUETA_DIA[dia].toLowerCase()}`}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  {config.abierto ? "Abierto" : "Cerrado"}
                </span>
              </label>
            </div>

            {config.abierto ? (
              <div className="mt-4 flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`apertura-${dia}`} className="mb-1 block text-xs font-semibold text-gray-600">
                      Apertura
                    </label>
                    <input
                      id={`apertura-${dia}`}
                      type="time"
                      value={config.apertura}
                      onChange={(e) => onCambiarDia(dia, { ...config, apertura: e.target.value })}
                      className={claseHora(!!error)}
                    />
                  </div>

                  <div>
                    <label htmlFor={`cierre-${dia}`} className="mb-1 block text-xs font-semibold text-gray-600">
                      Cierre
                    </label>
                    <input
                      id={`cierre-${dia}`}
                      type="time"
                      value={config.cierre}
                      disabled={conTransnoche}
                      onChange={(e) => onCambiarDia(dia, { ...config, cierre: e.target.value })}
                      className={claseHora(!!error)}
                    />
                  </div>
                </div>

                {/* Atención Trasnoche: sigue abierto después de medianoche */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={alternarTransnoche}
                    disabled={!conTransnoche && tope < 1}
                    aria-pressed={conTransnoche}
                    title={
                      !conTransnoche && tope < 1
                        ? "El día siguiente abre muy temprano: no admite transnoche"
                        : "Sigue abierto después de medianoche (el cierre queda a las 23:59)"
                    }
                    className={`inline-flex items-center gap-1.5 rounded border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      conTransnoche
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Moon size={14} />
                    Atención Trasnoche
                  </button>

                  {conTransnoche && (
                    <>
                      <input
                        type="time"
                        value={minutosAHora(config.transnocheMin ?? 0)}
                        min="00:01"
                        max={minutosAHora(Math.max(tope, 1))}
                        onChange={(e) => cambiarExceso(e.target.value)}
                        aria-label={`Horas de transnoche del ${ETIQUETA_DIA[dia].toLowerCase()}`}
                        className={`${claseHora(!!error)} w-28`}
                      />
                      <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {formatearExceso(config.transnocheMin ?? 0)}
                      </span>
                      <span className="text-xs text-gray-500">máx. {formatearExceso(tope)}</span>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400 italic">Sin atención este día.</p>
            )}

            {error && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{error}</p>}

            <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
              <MenuReplicar
                diaActual={dia}
                onReplicar={(destinos) => replicarHorario(dia, destinos)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
