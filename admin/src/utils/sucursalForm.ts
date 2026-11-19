import {
  DIAS_SEMANA,
  ZONA_HORARIA_POR_DEFECTO,
  type DatosSucursal,
  type HorarioSemana,
  type PayloadSucursal,
  type Sucursal,
} from '../types/sucursal.types'
import { horarioPorDefecto, normalizarHorario, validarHorario, validarZonaHoraria } from './horario'

// Formulario vacío para una sucursal nueva (objeto nuevo en cada llamada)
export function sucursalVacia(): DatosSucursal {
  return {
    nombre: '',
    telefono: '',
    horario: horarioPorDefecto(),
    zonaHoraria: ZONA_HORARIA_POR_DEFECTO,
    ubicacion: { calle: '', numero: '', localidad: '', provincia: '', codigoPostal: '', latitud: null, longitud: null },
  }
}

// De la sucursal que devuelve el backend al formulario
export function desdeSucursal(s: Sucursal): DatosSucursal {
  const zona =
    typeof s.zona_horaria === 'string' && s.zona_horaria.trim() ? s.zona_horaria.trim() : ZONA_HORARIA_POR_DEFECTO
  return {
    nombre: s.nombre ?? '',
    telefono: s.telefono ?? '',
    horario: normalizarHorario(s.horario),
    zonaHoraria: zona,
    ubicacion: {
      calle: s.calle ?? '',
      numero: s.numero ?? '',
      localidad: s.localidad ?? '',
      provincia: s.provincia ?? '',
      codigoPostal: s.codigoPostal ?? '',
      latitud: s.latitud != null ? Number(s.latitud) : null,
      longitud: s.longitud != null ? Number(s.longitud) : null,
    },
  }
}

// El backend exige que un día cerrado no tenga turnos: se limpia antes de enviar
function horarioParaEnviar(horario: HorarioSemana): HorarioSemana {
  return Object.fromEntries(
    DIAS_SEMANA.map((dia) => {
      const config = horario[dia]
      if (!config || !config.abierto) return [dia, { abierto: false, turnos: [] }]

      return [
        dia,
        {
          abierto: true,
          turnos: config.turnos.slice(0, 2).map((turno) => ({
            apertura: turno.apertura,
            cierre: turno.cierre,
            cruzaMedianoche: turno.cruzaMedianoche,
          })),
        },
      ]
    }),
  ) as HorarioSemana
}

// Del formulario a lo que espera el backend (las claves exactas del schema Joi)
export function aPedido(d: DatosSucursal): PayloadSucursal {
  return {
    nombre: d.nombre.trim(),
    telefono: d.telefono.trim(),
    horario: horarioParaEnviar(normalizarHorario(d.horario)),
    zona_horaria: d.zonaHoraria.trim(),
    calle: d.ubicacion.calle,
    numero: d.ubicacion.numero,
    localidad: d.ubicacion.localidad,
    provincia: d.ubicacion.provincia,
    codigoPostal: d.ubicacion.codigoPostal,
    latitud: d.ubicacion.latitud,
    longitud: d.ubicacion.longitud,
  }
}

// Devuelve el error del paso, o '' si está completo
export function validarPaso(n: number, d: DatosSucursal): string {
  if (n === 1) {
    if (d.nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.'
    if (d.telefono && !/^[0-9+\s-]*$/.test(d.telefono)) {
      return 'El teléfono solo puede contener números, espacios, guiones y el signo +.'
    }
  }
  if (n === 2) {
    const errorHorario = validarHorario(d.horario)
    if (errorHorario) return errorHorario
    return validarZonaHoraria(d.zonaHoraria)
  }
  if (n === 3) {
    const u = d.ubicacion
    if (!u.calle || !u.numero) return 'Buscá y elegí la dirección de la sucursal, con altura.'
    if (u.latitud === null || u.longitud === null) return 'Marcá la ubicación en el mapa.'
    if (!u.localidad || !u.provincia) return 'La dirección elegida no tiene localidad o provincia. Probá con otra búsqueda.'
  }
  return ''
}
