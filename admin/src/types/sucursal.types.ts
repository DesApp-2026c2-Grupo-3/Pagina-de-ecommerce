// Tipos de sucursales del panel de administración.
// El horario es un objeto con los 7 días de la semana (JSONB en el backend).
// Cada día tiene un estado y hasta dos turnos; el cierre puede caer al día siguiente.
// La zona horaria es un identificador IANA en el que se interpretan las horas.

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
] as const;

export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const ZONA_HORARIA_POR_DEFECTO = "America/Argentina/Buenos_Aires";

export interface HorarioTurno {
  apertura: string;
  cierre: string;
  cruzaMedianoche: boolean;
}

export interface HorarioDia {
  abierto: boolean;
  turnos: HorarioTurno[];
}

export type HorarioSemana = Record<DiaSemana, HorarioDia>;

export interface UbicacionSucursal {
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  latitud: number | null;
  longitud: number | null;
}

// Lo que devuelve el backend. El horario llega como objeto JSONB (o como texto
// de versiones viejas): se normaliza con normalizarHorario antes de usarlo.
export interface Sucursal {
  id: number;
  nombre: string;
  activa: boolean;
  telefono?: string | null;
  horario?: unknown;
  zona_horaria?: string | null;
  calle?: string | null;
  numero?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigoPostal?: string | null;
  latitud?: number | string | null;
  longitud?: number | string | null;
}

// Datos del formulario (todo string, como se maneja en los inputs)
export interface DatosSucursal {
  nombre: string;
  telefono: string;
  horario: HorarioSemana;
  zonaHoraria: string;
  ubicacion: UbicacionSucursal;
}

// Respuesta de crear/editar/cambiar estado
export interface RespuestaSucursal {
  mensaje?: string;
  sucursal: Sucursal;
}
export const ETIQUETA_DIA: Record<DiaSemana, string> = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};
// Lo que espera el backend al crear o editar (claves exactas del schema Joi, sin extras)
export interface PayloadSucursal {
  nombre: string;
  telefono: string;
  horario: HorarioSemana;
  zona_horaria: string;
  calle: string;
  numero: string;
  localidad: string;
  provincia: string;
  codigoPostal: string;
  latitud: number | null;
  longitud: number | null;
}
