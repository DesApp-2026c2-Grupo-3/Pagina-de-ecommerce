import { describe, expect, test } from 'vitest'
import { traducirError } from '../../utils/errorMessages'

describe('traducirError', () => {
  test.each([
    ['email-en-uso', 'Ese email ya está registrado. Probá con otro o iniciá sesión.'],
    ['email-password-incorrectos', 'Email o contraseña incorrectos.'],
    ['password-actual-requerida', 'Ingresá tu contraseña actual para poder cambiarla.'],
    ['password-actual-incorrecta', 'La contraseña actual no es correcta.'],
  ])('traduce el código "%s"', (codigo, mensaje) => {
    expect(traducirError(codigo)).toBe(mensaje)
  })

  test.each([
    '"telefono" with value "abc" fails to match the required pattern',
    'El campo no cumple el pattern',
  ])('oculta los mensajes técnicos de validación: "%s"', (codigo) => {
    expect(traducirError(codigo)).toBe(
      'Uno de los campos tiene un formato no válido. Revisá los datos ingresados.',
    )
  })

  test('deja pasar los mensajes que ya vienen en español desde el backend', () => {
    expect(traducirError('La sucursal está cerrada')).toBe('La sucursal está cerrada')
  })
})