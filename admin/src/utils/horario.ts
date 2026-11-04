import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
  type HorarioTurno,
} from "../types/sucursal.types";

// Etiquetas para mostrar (el backend usa claves sin acentos)
export const ETIQUETA_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const ETIQUETA_DIA_CORTA: Record<DiaSemana, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

// Zonas de Argentina para el selector; la primera es la que usa el formulario por defecto
export const ZONAS_HORARIAS = [
  ZONA_HORARIA_POR_DEFECTO,
  "America/Argentina/Cordoba",
  "America/Argentina/Mendoza",
  "America/Argentina/Salta",
  "America/Argentina/San_Juan",
  "America/Argentina/San_Luis",
  "America/Argentina/Tucuman",
  "America/Argentina/Catamarca",
  "America/Argentina/Jujuy",
  "America/Argentina/La_Rioja",
  "America/Argentina/Rio_Gallegos",
  "America/Argentina/Ushuaia",
];

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TURNOS_MAXIMOS = 2;
const MINUTOS_POR_DIA = 24 * 60;

export function esHoraValida(valor: string) {
  return HORA_REGEX.test(valor);
}

// ¿La zona es un identificador IANA válido? Intl lanza RangeError si no lo es
export function esZonaHorariaValida(zona: string) {
  if (typeof zona !== "string" || !zona.trim()) return false;
  try {
    new Intl.DateTimeFormat("es-AR", { timeZone: zona.trim() });
    return true;
  } catch {
    return false;
  }
}

function aMinutos(hhmm: string) {
  const match = HORA_REGEX.exec(hhmm);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// Un turno nuevo por defecto (objeto nuevo en cada llamada)
export function turnoPorDefecto(): HorarioTurno {
  return { apertura: "09:00", cierre: "23:00", cruzaMedianoche: false };
}

// Un horario completo nuevo (objeto nuevo en cada llamada: nunca se comparte)
export function horarioPorDefecto(): HorarioSemana {
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [
      dia,
      { abierto: true, turnos: [turnoPorDefecto()] },
    ]),
  ) as HorarioSemana;
}

function normalizarTurno(valor: unknown): HorarioTurno | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;

  const { apertura, cierre, cruzaMedianoche } = valor as Record<
    string,
    unknown
  >;
  if (typeof apertura !== "string" || !esHoraValida(apertura)) return null;
  if (typeof cierre !== "string" || !esHoraValida(cierre)) return null;

  const minutosApertura = aMinutos(apertura) as number;
  const minutosCierre = aMinutos(cierre) as number;
  const cruceInferido = cierre !== "00:00" && minutosCierre < minutosApertura;

  return {
    apertura,
    cierre,
    cruzaMedianoche:
      typeof cruzaMedianoche === "boolean" ? cruzaMedianoche : cruceInferido,
  };
}

function normalizarDia(valor: unknown): HorarioDia {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { abierto: true, turnos: [turnoPorDefecto()] };
  }

  const config = valor as Record<string, unknown>;
  const abierto = typeof config.abierto === "boolean" ? config.abierto : true;

  if (!abierto) return { abierto: false, turnos: [] };

  if (Array.isArray(config.turnos)) {
    const turnos = config.turnos
      .slice(0, TURNOS_MAXIMOS)
      .map(normalizarTurno)
      .filter((turno): turno is HorarioTurno => turno !== null);

    return { abierto: true, turnos };
  }

  // Formato viejo: apertura y cierre a nivel de día. Se convierte a un solo turno.
  const turno = normalizarTurno({
    apertura: config.apertura,
    cierre: config.cierre,
  });
  return { abierto: true, turnos: turno ? [turno] : [turnoPorDefecto()] };
}

// Normaliza lo que venga del backend a un horario completo.
// Acepta el formato nuevo, el viejo y objetos parciales; lo que no sirve cae al valor por defecto.
export function normalizarHorario(valor: unknown): HorarioSemana {
  if (!valor || typeof valor !== "object" || Array.isArray(valor))
    return horarioPorDefecto();

  const objeto = valor as Record<string, unknown>;
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, normalizarDia(objeto[dia])]),
  ) as HorarioSemana;
}

function clonarDia(config: HorarioDia): HorarioDia {
  return {
    abierto: config.abierto,
    turnos: config.turnos.map((turno) => ({ ...turno })),
  };
}

// Copia el horario de un día al resto de la semana (objetos nuevos, sin compartir referencias)
export function aplicarDiaATodos(
  horario: HorarioSemana,
  dia: DiaSemana,
): HorarioSemana {
  const base = clonarDia(horario[dia]);
  return Object.fromEntries(
    DIAS_SEMANA.map((d) => [d, clonarDia(base)]),
  ) as HorarioSemana;
}

function mismoTurno(a: HorarioTurno, b: HorarioTurno) {
  return (
    a.apertura === b.apertura &&
    a.cierre === b.cierre &&
    a.cruzaMedianoche === b.cruzaMedianoche
  );
}

function mismoHorario(a: HorarioDia, b: HorarioDia) {
  return (
    a.abierto === b.abierto &&
    a.turnos.length === b.turnos.length &&
    a.turnos.every((turno, i) => mismoTurno(turno, b.turnos[i]))
  );
}

// Horas que el cierre pasa de la medianoche, listas para mostrar en el badge.
// Devuelve "" si el turno no cruza o si el cruce no es válido.
export function formatearHorasExtras(turno: HorarioTurno) {
  if (!turno.cruzaMedianoche) return "";

  const apertura = aMinutos(turno.apertura);
  const cierre = aMinutos(turno.cierre);
  if (
    apertura === null ||
    cierre === null ||
    cierre === 0 ||
    cierre >= apertura
  )
    return "";

  const horas = Math.floor(cierre / 60);
  const minutos = cierre % 60;

  if (horas === 0) return `+${minutos}m`;
  return minutos === 0 ? `+${horas}h` : `+${horas}h ${minutos}m`;
}

export function formatearTurno(turno: HorarioTurno) {
  const extra = formatearHorasExtras(turno);
  const sufijo = extra
    ? ` (${extra})`
    : turno.cruzaMedianoche
      ? " (+1 día)"
      : "";
  return `${turno.apertura}–${turno.cierre}${sufijo}`;
}

// Texto compacto, agrupando días seguidos con el mismo horario.
// El horario viejo (texto) se muestra tal cual; un valor que no sirve devuelve "—".
export function formatearHorario(valor: unknown): string {
  if (typeof valor === "string") return valor.trim() || "—";
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return "—";

  const objeto = valor as Record<string, unknown>;
  if (!DIAS_SEMANA.some((dia) => dia in objeto)) return "—";

  const horario = normalizarHorario(objeto);
  const grupos: { desde: DiaSemana; hasta: DiaSemana; config: HorarioDia }[] =
    [];
  for (const dia of DIAS_SEMANA) {
    const config = horario[dia];
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && mismoHorario(ultimo.config, config)) {
      ultimo.hasta = dia;
    } else {
      grupos.push({ desde: dia, hasta: dia, config });
    }
  }

  return grupos
    .map(({ desde, hasta, config }) => {
      const dias =
        desde === hasta
          ? ETIQUETA_DIA_CORTA[desde]
          : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`;
      if (!config.abierto) return `${dias} cerrado`;
      const turnos = config.turnos.length
        ? config.turnos.map(formatearTurno).join(" y ")
        : "sin turnos";
      return `${dias} ${turnos}`;
    })
    .join(" · ");
}

// Opciones del selector: las curadas, más la zona actual si no está en la lista
// (para no perder una zona cargada desde afuera del panel)
export function opcionesZonaHoraria(zonaActual: string) {
  const actual = (zonaActual ?? "").trim();
  if (actual && !ZONAS_HORARIAS.includes(actual))
    return [...ZONAS_HORARIAS, actual];
  return [...ZONAS_HORARIAS];
}

// Valida un turno individual. Devuelve "" si es válido.
export function validarTurno(turno: unknown): string {
  if (!turno || typeof turno !== "object" || Array.isArray(turno))
    return "el turno debe ser un objeto";

  const { apertura, cierre, cruzaMedianoche } = turno as Record<
    string,
    unknown
  >;

  if (typeof apertura !== "string" || !esHoraValida(apertura)) {
    return 'la apertura debe tener formato HH:MM (ej: "09:00")';
  }
  if (typeof cierre !== "string" || !esHoraValida(cierre)) {
    return 'el cierre debe tener formato HH:MM (ej: "23:00")';
  }
  if (typeof cruzaMedianoche !== "boolean")
    return "debe indicar si el cierre es al día siguiente";

  const minutosApertura = aMinutos(apertura) as number;
  const minutosCierre = aMinutos(cierre) as number;

  if (minutosApertura === minutosCierre)
    return "el cierre no puede ser igual a la apertura";

  if (cruzaMedianoche) {
    if (cierre === "00:00") {
      return 'el cierre "00:00" no puede ser al día siguiente; usalo como fin del día';
    }
    if (minutosCierre >= minutosApertura) {
      return "está marcado como día siguiente pero el cierre no es anterior a la apertura";
    }
    return "";
  }

  // Sin cruce, el cierre "00:00" representa las 24:00 (fin del día).
  if (minutosCierre !== 0 && minutosCierre < minutosApertura) {
    return "el cierre es anterior a la apertura: activá el botón de día siguiente o corregí el horario";
  }

  return "";
}

// Valida un día completo: estructura, turnos y solapamiento entre sus dos turnos.
export function validarDia(
  dia: DiaSemana,
  config: HorarioDia | undefined,
): string {
  const nombre = ETIQUETA_DIA[dia].toLowerCase();

  if (!config) return `Completá el horario del ${nombre}.`;
  if (typeof config.abierto !== "boolean")
    return `El estado "abierto" del ${nombre} debe ser true o false.`;
  if (!Array.isArray(config.turnos))
    return `El ${nombre} debe indicar sus turnos.`;
  if (config.turnos.length > TURNOS_MAXIMOS)
    return `El ${nombre} admite como máximo ${TURNOS_MAXIMOS} turnos.`;

  if (!config.abierto) {
    if (config.turnos.length > 0)
      return `El ${nombre} está cerrado y no puede tener turnos.`;
    return "";
  }

  if (config.turnos.length === 0)
    return `El ${nombre} está abierto y debe tener al menos un turno.`;

  for (let i = 0; i < config.turnos.length; i++) {
    const error = validarTurno(config.turnos[i]);
    if (error) return `El turno ${i + 1} del ${nombre}: ${error}.`;
  }

  if (config.turnos.length === TURNOS_MAXIMOS) {
    const [turno1, turno2] = config.turnos;

    if (turno1.cruzaMedianoche) {
      return `El turno 1 del ${nombre} termina al día siguiente, así que no puede tener un turno 2 el mismo día.`;
    }

    const cierre1 = aMinutos(turno1.cierre) as number;
    const cierre1Efectivo = cierre1 === 0 ? MINUTOS_POR_DIA : cierre1;
    const apertura2 = aMinutos(turno2.apertura) as number;

    if (apertura2 <= cierre1Efectivo) {
      return `El turno 2 del ${nombre} debe abrir después del cierre del turno 1 (${turno1.apertura}–${turno1.cierre}).`;
    }
  }

  return "";
}

export interface ConflictoEntreDias {
  dia: DiaSemana;
  siguiente: DiaSemana;
  indiceTurno: number;
  indiceTurnoSiguiente: number;
  cierre: string;
  apertura: string;
  horasExtras: string;
  mensajeDia: string;
  mensajeSiguiente: string;
}

// Compara el último turno de cada día con el primero del día siguiente.
// En horarios válidos, solo el último turno puede cruzar la medianoche.
export function conflictosEntreDias(
  horario: HorarioSemana,
): ConflictoEntreDias[] {
  const conflictos: ConflictoEntreDias[] = [];

  for (let i = 0; i < DIAS_SEMANA.length; i++) {
    const dia = DIAS_SEMANA[i];
    const siguiente = DIAS_SEMANA[(i + 1) % DIAS_SEMANA.length];
    const config = horario[dia];

    if (
      !config ||
      config.abierto !== true ||
      !Array.isArray(config.turnos) ||
      config.turnos.length === 0
    )
      continue;

    const configSiguiente = horario[siguiente];
    if (
      !configSiguiente ||
      configSiguiente.abierto !== true ||
      !Array.isArray(configSiguiente.turnos) ||
      configSiguiente.turnos.length === 0
    ) {
      continue;
    }

    const indiceTurno = config.turnos.length - 1;
    const turno = config.turnos[indiceTurno];
    const turnoSiguiente = configSiguiente.turnos[0];

    if (!turno || !turnoSiguiente || turno.cruzaMedianoche !== true) continue;

    // Si alguno de los dos turnos tiene un error local, lo resuelve validarDia.
    if (validarTurno(turno) || validarTurno(turnoSiguiente)) continue;

    const cierre = aMinutos(turno.cierre);
    const apertura = aMinutos(turnoSiguiente.apertura);
    if (cierre === null || apertura === null || apertura > cierre) continue;

    const nombreDia = ETIQUETA_DIA[dia].toLowerCase();
    const nombreSiguiente = ETIQUETA_DIA[siguiente].toLowerCase();
    const horasExtras = formatearHorasExtras(turno);
    const detalleHoras = horasExtras ? ` (${horasExtras})` : "";

    conflictos.push({
      dia,
      siguiente,
      indiceTurno,
      indiceTurnoSiguiente: 0,
      cierre: turno.cierre,
      apertura: turnoSiguiente.apertura,
      horasExtras,
      mensajeDia: `El cierre del ${nombreDia} a las ${turno.cierre}${detalleHoras} se superpone con la apertura del ${nombreSiguiente} a las ${turnoSiguiente.apertura}. La apertura del ${nombreSiguiente} debe ser posterior a las ${turno.cierre}.`,
      mensajeSiguiente: `La apertura del ${nombreSiguiente} a las ${turnoSiguiente.apertura} no puede ser anterior al cierre del ${nombreDia} a las ${turno.cierre}${detalleHoras}.`,
    });
  }

  return conflictos;
}

// Compatibilidad con el formulario: devuelve el primer conflicto encontrado.
export function validarHorarioEntreDias(horario: HorarioSemana): string {
  return conflictosEntreDias(horario)[0]?.mensajeDia ?? "";
}

export function validarHorario(horario: HorarioSemana): string {
  for (const dia of DIAS_SEMANA) {
    const error = validarDia(dia, horario[dia]);
    if (error) return error;
  }
  return validarHorarioEntreDias(horario);
}

export function validarZonaHoraria(zona: string): string {
  return esZonaHorariaValida(zona) ? "" : "Elegí una zona horaria válida.";
}
