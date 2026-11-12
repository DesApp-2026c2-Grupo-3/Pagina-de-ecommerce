import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DiaSemana,
  type HorarioDia,
  type HorarioSemana,
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

// Reglas de la transnoche (las mismas que valida el backend en utils/horarioSucursal.js)
export const FIN_DE_DIA = "23:59"; // cuenta como las 24:00
const MINUTOS_POR_DIA = 24 * 60;
const TRANSNOCHE_MAXIMA = 6 * 60; // hasta las 06:00
const ANTELACION_APERTURA = 60; // termina al menos 1 hora antes de que abra el día siguiente

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function esHoraValida(valor: string) {
  return HORA_REGEX.test(valor);
}

export function aMinutos(hhmm: unknown) {
  const match = HORA_REGEX.exec(String(hhmm ?? ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

const finDelDia = (cierre: string) =>
  cierre === FIN_DE_DIA ? MINUTOS_POR_DIA : aMinutos(cierre);

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

export function opcionesZonaHoraria(zonaActual: string) {
  const actual = (zonaActual ?? "").trim();
  if (actual && !ZONAS_HORARIAS.includes(actual))
    return [...ZONAS_HORARIAS, actual];
  return [...ZONAS_HORARIAS];
}

export function validarZonaHoraria(zona: string): string {
  return esZonaHorariaValida(zona) ? "" : "Elegí una zona horaria válida.";
}

// ---- Horario por defecto y normalización ----

export function horarioPorDefecto(): HorarioSemana {
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [
      dia,
      { abierto: true, apertura: "09:00", cierre: "23:00" },
    ]),
  ) as HorarioSemana;
}

// Lleva un día guardado (en el formato actual o en uno viejo) al formato actual:
//  - formato de turnos: una sola franja, de la primera apertura al último cierre
//  - un cierre menor que la apertura pasaba la medianoche: ahora cierra 23:59 con transnoche
//  - el cierre "00:00" era el final del día: ahora 23:59
function normalizarDia(valor: unknown, porDefecto: HorarioDia): HorarioDia {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return { ...porDefecto };
  }
  const dia = valor as Record<string, unknown>;
  const turnos = Array.isArray(dia.turnos)
    ? (dia.turnos as Record<string, unknown>[]).filter(
        (t) => aMinutos(t?.apertura) !== null && aMinutos(t?.cierre) !== null,
      )
    : null;

  const apertura = String((turnos ? turnos[0]?.apertura : dia.apertura) ?? "");
  const origen = (turnos ? turnos[turnos.length - 1] : dia) as Record<string, unknown> | undefined;
  const cierre = String(origen?.cierre ?? "");
  const abierto = dia.abierto !== false;

  if (aMinutos(apertura) === null || aMinutos(cierre) === null) {
    return { ...porDefecto, abierto };
  }
  if (!abierto) return { abierto: false, apertura, cierre };

  const cierreMin = aMinutos(cierre) as number;
  const pasaMedianoche = turnos
    ? origen?.cruzaMedianoche === true
    : cierreMin !== 0 && cierreMin < (aMinutos(apertura) as number);

  if (pasaMedianoche) {
    return { abierto, apertura, cierre: FIN_DE_DIA, ...(cierreMin > 0 ? { transnocheMin: cierreMin } : {}) };
  }
  if (cierreMin === 0) return { abierto, apertura, cierre: FIN_DE_DIA };

  const extra = Number.isInteger(dia.transnocheMin) ? (dia.transnocheMin as number) : 0;
  return {
    abierto,
    apertura,
    cierre,
    ...(cierre === FIN_DE_DIA && extra > 0 ? { transnocheMin: extra } : {}),
  };
}

// El horario puede llegar como objeto, como texto JSON o con un formato viejo: siempre devuelve uno válido en forma
export function normalizarHorario(valor: unknown): HorarioSemana {
  let horario = valor;
  if (typeof horario === "string") {
    try {
      horario = JSON.parse(horario);
    } catch {
      horario = null;
    }
  }
  const objeto =
    horario && typeof horario === "object" && !Array.isArray(horario)
      ? (horario as Record<string, unknown>)
      : {};
  const base = horarioPorDefecto();
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => [dia, normalizarDia(objeto[dia], base[dia])]),
  ) as HorarioSemana;
}

// ---- Transnoche ----

// 150 -> "+02:30"
export function formatearExceso(minutos: number) {
  const hh = String(Math.floor(minutos / 60)).padStart(2, "0");
  const mm = String(minutos % 60).padStart(2, "0");
  return `+${hh}:${mm}`;
}

// Máximo de minutos de transnoche de un día: una hora antes de que abra el día siguiente, hasta las 06:00
export function topeTransnoche(horario: HorarioSemana, dia: DiaSemana): number {
  const siguiente = horario[DIAS_SEMANA[(DIAS_SEMANA.indexOf(dia) + 1) % DIAS_SEMANA.length]];
  const apertura = siguiente?.abierto ? aMinutos(siguiente.apertura) : null;
  return apertura === null
    ? TRANSNOCHE_MAXIMA
    : Math.min(TRANSNOCHE_MAXIMA, apertura - ANTELACION_APERTURA);
}

// ---- Validación (devuelve el error, o "" si está bien) ----

export function validarDia(dia: DiaSemana, config: HorarioDia, horario?: HorarioSemana): string {
  const nombre = ETIQUETA_DIA[dia].toLowerCase();
  const apertura = aMinutos(config.apertura);
  const fin = finDelDia(config.cierre);
  const extra = config.transnocheMin;

  if (apertura === null || fin === null) return "Las horas van de 00:00 a 23:59.";
  if (!config.abierto) return "";
  if (fin <= apertura) return "El cierre tiene que ser posterior a la apertura.";
  if (extra == null) return "";

  if (!Number.isInteger(extra) || extra < 1) return "La transnoche tiene que ser de al menos 1 minuto.";
  if (config.cierre !== FIN_DE_DIA) return `La transnoche requiere cerrar a las ${FIN_DE_DIA}.`;

  const tope = horario ? topeTransnoche(horario, dia) : TRANSNOCHE_MAXIMA;
  if (tope < 1) return `El día siguiente abre muy temprano: el ${nombre} no admite transnoche.`;
  if (extra > tope) return `La transnoche puede llegar hasta ${formatearExceso(tope)}.`;
  return "";
}

// Primer error de la semana, o "" si todo está bien
export function validarHorario(horario: HorarioSemana): string {
  for (const dia of DIAS_SEMANA) {
    const error = validarDia(dia, horario[dia], horario);
    if (error) return `${ETIQUETA_DIA[dia]}: ${error}`;
  }
  return "";
}

// ---- Presentación ----

// "18:00 a 23:59 +02:30"
export function formatearDia(config: HorarioDia) {
  const horas = `${config.apertura} a ${config.cierre}`;
  return config.transnocheMin ? `${horas} ${formatearExceso(config.transnocheMin)}` : horas;
}

const mismoDia = (a: HorarioDia, b: HorarioDia) =>
  a.abierto === b.abierto &&
  a.apertura === b.apertura &&
  a.cierre === b.cierre &&
  (a.transnocheMin ?? 0) === (b.transnocheMin ?? 0);

// "Lun a Vie 09:00 a 23:00 · Sáb 10:00 a 23:59 +02:30 · Dom cerrado"
export function formatearHorario(valor: unknown): string {
  const horario = normalizarHorario(valor);
  const grupos: { desde: DiaSemana; hasta: DiaSemana; config: HorarioDia }[] = [];

  for (const dia of DIAS_SEMANA) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && mismoDia(ultimo.config, horario[dia])) ultimo.hasta = dia;
    else grupos.push({ desde: dia, hasta: dia, config: horario[dia] });
  }

  return grupos
    .map(({ desde, hasta, config }) => {
      const dias =
        desde === hasta
          ? ETIQUETA_DIA_CORTA[desde]
          : `${ETIQUETA_DIA_CORTA[desde]} a ${ETIQUETA_DIA_CORTA[hasta]}`;
      return config.abierto ? `${dias} ${formatearDia(config)}` : `${dias} cerrado`;
    })
    .join(" · ");
}
