import { MOTIVO_CANCELACION_MAX, MOTIVO_CANCELACION_MIN } from '../../config/pedidos'

export const ERROR_MOTIVO_CANCELACION = 'Escribí el motivo: el cliente lo va a ver en la notificación.'

// Misma validación que el backend (Joi: texto de 3 a 200 caracteres, sin contar los espacios de los bordes)
// Devuelve el motivo listo para enviar y el error ('' si es válido)
export function validarMotivoCancelacion(texto: string): { motivo: string; error: string } {
  const motivo = texto.trim()
  const valido = motivo.length >= MOTIVO_CANCELACION_MIN && motivo.length <= MOTIVO_CANCELACION_MAX
  return { motivo, error: valido ? '' : ERROR_MOTIVO_CANCELACION }
}
