// Hoy en Argentina, como "AAAA-MM-DD" (el formato del <input type="date">)
export function hoyEnArgentina() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' })
}

export const EDAD_MINIMA = 18

// Edad cumplida a una fecha, ej: edadEn('2008-09-30', '2026-09-29') → 17 (cumple mañana)
export function edadEn(fechaNacimiento: string, hoy = hoyEnArgentina()) {
  const [anioN, mesN, diaN] = fechaNacimiento.split('-').map(Number)
  const [anioH, mesH, diaH] = hoy.split('-').map(Number)
  let edad = anioH - anioN
  // Si este año todavía no cumplió, tiene uno menos
  if (mesH < mesN || (mesH === mesN && diaH < diaN)) edad--
  return edad
}

// La fecha de nacimiento más reciente permitida (para el calendario)
export function fechaLimiteEdad(hoy = hoyEnArgentina()) {
  const [anio, mes, dia] = hoy.split('-').map(Number)
  return new Date(Date.UTC(anio - EDAD_MINIMA, mes - 1, dia)).toISOString().slice(0, 10)
}
export function validarNombre(nombre: string) {
  const valor = nombre.trim()
  if (!valor) return 'El nombre es obligatorio'
  if (valor.length < 3) return 'El nombre debe tener al menos 3 caracteres'
  if (valor.length > 20) return 'El nombre no puede superar los 20 caracteres'
  if (!/^(?=.*\p{L})[\p{L}\p{N}\s]+$/u.test(valor)) {
    return 'El nombre solo puede contener letras, números y espacios'
  }
  return ''
}

export function validarApellido(apellido: string) {
  const valor = apellido.trim()
  if (valor.length > 20) return 'El apellido no puede superar los 20 caracteres'
  if (valor && !/^[\p{L}\s'-]+$/u.test(valor)) return 'El apellido solo puede contener letras'
  return ''
}

export function validarTelefono(telefono: string) {
  const valor = telefono.trim()
  if (!valor) return '' // es opcional
  if (!/^[0-9+\s-]+$/.test(valor)) return 'El teléfono solo puede contener números, espacios, guiones y el signo +'
  const digitos = valor.replace(/\D/g, '').length
  if (digitos < 8 || digitos > 15) return 'El teléfono debe tener entre 8 y 15 números'
  return ''
}

export function validarDni(dni: string) {
  const valor = dni.trim().replace(/\./g, '') // se aceptan los puntos: "30.123.456"
  if (!valor) return '' // es opcional
  if (!/^\d+$/.test(valor)) return 'El DNI solo puede contener números'
  if (valor.length < 7 || valor.length > 8) return 'El DNI debe tener 7 u 8 números'
  return ''
}

export function validarFechaNacimiento(fecha: string, hoy = hoyEnArgentina()) {
  if (!fecha) return '' // es opcional
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'La fecha de nacimiento no es válida'
  if (fecha > hoy) return 'La fecha de nacimiento no puede ser futura'
  if (fecha < '1900-01-01') return 'Revisá el año de nacimiento'
  if (edadEn(fecha, hoy) < EDAD_MINIMA) return `Tenés que tener al menos ${EDAD_MINIMA} años`
  return ''
  return ''
}