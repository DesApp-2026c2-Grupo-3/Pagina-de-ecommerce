import { Moon, Plus, Trash2 } from "lucide-react";
import {
  DIAS_SEMANA,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
  type HorarioTurno,
} from "../types/sucursal.types";
import {
  ETIQUETA_DIA,
  conflictosEntreDias,
  formatearHorasExtras,
  turnoPorDefecto,
  validarDia,
} from "../utils/horario";
import MenuReplicar from "./MenuReplicar";

interface Props {
  horario: HorarioSemana;
  onCambiarDia: (dia: DiaSemana, valor: HorarioDia) => void;
  // Ya no necesitamos onAplicarATodos global, la replicación es por tarjeta
}

const campoHora =
  "w-full rounded border p-2 disabled:bg-gray-100 disabled:text-gray-400 text-sm";
const botonAgregar =
  "inline-flex items-center gap-1.5 rounded border border-orange-300 px-3 py-2 text-xs font-semibold text-action hover:bg-orange-50 transition-colors";
const botonQuitar =
  "rounded border bg-red-100 p-2 text-danger hover:bg-red-200 transition-colors shrink-0";

const segundoTurnoPorDefecto = (): HorarioTurno => ({
  apertura: "17:00",
  cierre: "23:00",
  cruzaMedianoche: false,
});

interface FilaTurnoProps {
  dia: DiaSemana;
  numero: 1 | 2;
  turno: HorarioTurno;
  invalidoApertura: boolean;
  invalidoCierre: boolean;
  onCambiar: (cambios: Partial<HorarioTurno>) => void;
  onQuitar?: () => void;
}

function FilaTurno({
  dia,
  numero,
  turno,
  invalidoApertura,
  invalidoCierre,
  onCambiar,
  onQuitar,
}: FilaTurnoProps) {
  const nombreDia = ETIQUETA_DIA[dia].toLowerCase();
  const claseApertura = `${campoHora} ${invalidoApertura ? "border-red-500 bg-red-50" : ""}`;
  const claseCierre = `${campoHora} ${invalidoCierre ? "border-red-500 bg-red-50" : ""}`;
  const horasExtras = formatearHorasExtras(turno);

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-gray-50/70 p-3 border border-gray-100">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Turno {numero}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto_auto] sm:items-center">
        {/* Apertura */}
        <label className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-gray-500 sm:hidden">
            Apertura
          </span>
          <input
            type="time"
            value={turno.apertura}
            onChange={(e) => onCambiar({ apertura: e.target.value })}
            aria-label={`Apertura del turno ${numero} del ${nombreDia}`}
            aria-invalid={invalidoApertura}
            className={claseApertura}
          />
        </label>

        <span className="hidden text-sm text-gray-400 sm:block">a</span>

        {/* Cierre + Badge Dinámico */}
        <label className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-xs text-gray-500 sm:hidden">
            Cierre
          </span>
          <span className="relative w-full">
            <input
              type="time"
              value={turno.cierre}
              onChange={(e) => onCambiar({ cierre: e.target.value })}
              aria-label={`Cierre del turno ${numero} del ${nombreDia}`}
              aria-invalid={invalidoCierre}
              className={claseCierre}
            />
            {turno.cruzaMedianoche && horasExtras && (
              <span className="pointer-events-none absolute -top-2 right-2 whitespace-nowrap rounded-full bg-action px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                {horasExtras}
              </span>
            )}
          </span>
        </label>

        {/* Botón Madrugada (Moon) */}
        <button
          type="button"
          onClick={() => onCambiar({ cruzaMedianoche: !turno.cruzaMedianoche })}
          disabled={turno.cierre === "00:00"}
          aria-pressed={turno.cruzaMedianoche}
          aria-label={`Cierre al día siguiente, turno ${numero} del ${nombreDia}`}
          title={
            turno.cierre === "00:00"
              ? "00:00 ya representa el final del día"
              : "Cierra al día siguiente (madrugada)"
          }
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-3 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            turno.cruzaMedianoche
              ? "border-action bg-action text-white shadow-sm"
              : "border-gray-300 bg-white text-gray-600 hover:border-action hover:text-action"
          }`}
        >
          <Moon size={15} />
          <span className="hidden sm:inline">Día siguiente</span>
        </button>

        {/* Botón Quitar Turno 2 (Ubicado limpiamente al extremo derecho de su fila) */}
        {onQuitar ? (
          <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar turno 2 del ${nombreDia}`}
            title="Eliminar este turno"
            className={botonQuitar}
          >
            <Trash2 size={16} />
          </button>
        ) : (
          <div className="hidden sm:block sm:w-8" /> /* Espaciador simétrico si no hay botón */
        )}
      </div>
    </div>
  );
}

export default function EditorHorario({ horario, onCambiarDia }: Props) {
  const conflictos = conflictosEntreDias(horario);

  function cambiarTurno(
    dia: DiaSemana,
    config: HorarioDia,
    indice: number,
    cambios: Partial<HorarioTurno>,
  ) {
    const turnos = config.turnos.map((turno, i) => {
      if (i !== indice) return turno;

      const actualizado = { ...turno, ...cambios };
      if (actualizado.cierre === "00:00") actualizado.cruzaMedianoche = false;
      return actualizado;
    });

    onCambiarDia(dia, { ...config, turnos });
  }

  function cambiarAbierto(
    dia: DiaSemana,
    config: HorarioDia,
    abierto: boolean,
  ) {
    if (!abierto) {
      onCambiarDia(dia, { abierto: false, turnos: [] });
      return;
    }

    onCambiarDia(dia, {
      abierto: true,
      turnos: config.turnos.length > 0 ? config.turnos : [turnoPorDefecto()],
    });
  }

  function agregarTurno(dia: DiaSemana, config: HorarioDia) {
    if (config.turnos.length >= 2) return;
    const nuevo =
      config.turnos.length === 0 ? turnoPorDefecto() : segundoTurnoPorDefecto();
    onCambiarDia(dia, { ...config, turnos: [...config.turnos, nuevo] });
  }

  function quitarSegundoTurno(dia: DiaSemana, config: HorarioDia) {
    onCambiarDia(dia, { ...config, turnos: config.turnos.slice(0, 1) });
  }

  function replicarHorario(diaOrigen: DiaSemana, diasDestino: DiaSemana[]) {
    const configOrigen = horario[diaOrigen];
    // Clonación profunda para evitar referencias compartidas
    const turnosClonados = JSON.parse(JSON.stringify(configOrigen.turnos));
    const abiertoClonado = configOrigen.abierto;

    DIAS_SEMANA.forEach((dia) => {
      if (diasDestino.includes(dia)) {
        onCambiarDia(dia, {
          abierto: abiertoClonado,
          turnos: JSON.parse(JSON.stringify(turnosClonados)),
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {DIAS_SEMANA.map((dia) => {
        const config = horario[dia];
        const error = validarDia(dia, config);
        const primerTurno = config.turnos[0];
        const segundoTurno = config.turnos[1];
        const ultimoIndice = config.turnos.length - 1;

        const conflictosCierre = conflictos.filter(
          (conflicto) => conflicto.dia === dia,
        );
        const conflictosApertura = conflictos.filter(
          (conflicto) => conflicto.siguiente === dia,
        );
        const mensajesConflicto = [
          ...conflictosCierre.map((c) => c.mensajeDia),
          ...conflictosApertura.map((c) => c.mensajeSiguiente),
        ];

        return (
          <div
            key={dia}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5 transition-all"
          >
            {/* Cabecera de la tarjeta: Día + Toggle Abierto/Cerrado */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <span className="text-base font-bold text-gray-800">
                {ETIQUETA_DIA[dia]}
              </span>

              <label className="inline-flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  role="switch"
                  checked={config.abierto}
                  onChange={(e) =>
                    cambiarAbierto(dia, config, e.target.checked)
                  }
                  aria-label={`Atiende los ${ETIQUETA_DIA[dia].toLowerCase()}`}
                  className="peer sr-only"
                />
                <span className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-green-500 peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  {config.abierto ? "Abierto" : "Cerrado"}
                </span>
              </label>
            </div>

            {/* Contenido de turnos */}
            {config.abierto ? (
              <div className="mt-4 flex flex-col gap-3">
                {primerTurno ? (
                  <FilaTurno
                    dia={dia}
                    numero={1}
                    turno={primerTurno}
                    invalidoApertura={!!error || conflictosApertura.length > 0}
                    invalidoCierre={
                      !!error ||
                      (ultimoIndice === 0 && conflictosCierre.length > 0)
                    }
                    onCambiar={(cambios) =>
                      cambiarTurno(dia, config, 0, cambios)
                    }
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    Este día no tiene turnos cargados.
                  </p>
                )}

                {segundoTurno ? (
                  <FilaTurno
                    dia={dia}
                    numero={2}
                    turno={segundoTurno}
                    invalidoApertura={!!error}
                    invalidoCierre={
                      !!error ||
                      (ultimoIndice === 1 && conflictosCierre.length > 0)
                    }
                    onCambiar={(cambios) =>
                      cambiarTurno(dia, config, 1, cambios)
                    }
                    onQuitar={() => quitarSegundoTurno(dia, config)}
                  />
                ) : primerTurno &&
                  (primerTurno.cruzaMedianoche ||
                    primerTurno.cierre === "00:00") ? (
                  <p className="text-xs text-gray-500 italic mt-1">
                    {primerTurno.cruzaMedianoche
                      ? "El turno 1 termina al día siguiente; no se puede agregar un turno 2 el mismo día."
                      : "El turno 1 termina a las 00:00; no queda margen para un turno 2."}
                  </p>
                ) : (
                  config.turnos.length < 2 && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => agregarTurno(dia, config)}
                        className={botonAgregar}
                      >
                        <Plus size={15} />
                        {config.turnos.length === 0
                          ? "Agregar turno"
                          : "Agregar turno 2"}
                      </button>
                    </div>
                  )
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400 italic">
                Sin atención este día.
              </p>
            )}

            {/* Errores y Conflictos */}
            {error && (
              <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>
            )}

            {mensajesConflicto.map((mensaje) => (
              <p
                key={mensaje}
                role="alert"
                className="mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs font-medium text-red-700"
              >
                {mensaje}
              </p>
            ))}

            {/* Pie de tarjeta: Botón Replicar contextual (alineado a la derecha, sin romper layout) */}
            <div className="mt-4 flex items-center justify-end border-t border-gray-100 pt-3">
              <MenuReplicar
                diaActual={dia}
                onReplicar={(diasDestino) => replicarHorario(dia, diasDestino)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
