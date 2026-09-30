import { describe, expect, test } from 'vitest'
import {
  edadEn,
  validarApellido,
  validarDni,
  validarFechaNacimiento,
  validarNombre,
  validarTelefono,
} from '../../utils/validacionesPerfil'

describe('validarNombre', () => {
  test.each(['Juan', 'José María', 'Iñaki'])('acepta "%s"', (nombre) => {
    expect(validarNombre(nombre)).toBe('')
  })

  test.each([
    ['', 'El nombre es obligatorio'],
    ['   ', 'El nombre es obligatorio'],
    ['Jo', 'El nombre debe tener al menos 3 caracteres'],
    ['a'.repeat(21), 'El nombre no puede superar los 20 caracteres'],
    ['Juan_1', 'El nombre solo puede contener letras, números y espacios'],
    ['12345', 'El nombre solo puede contener letras, números y espacios'],
  ])('rechaza "%s"', (nombre, mensaje) => {
    expect(validarNombre(nombre)).toBe(mensaje)
  })
})

describe('validarApellido', () => {
  test.each(['', 'Pérez', "D'Alessandro", 'García-Márquez'])('acepta "%s"', (apellido) => {
    expect(validarApellido(apellido)).toBe('')
  })

  test('rechaza números', () => {
    expect(validarApellido('Pérez2')).toBe('El apellido solo puede contener letras')
  })
})

describe('validarTelefono', () => {
  test.each(['', '11 1234-5678', '+54 9 11 1234-5678', '1112345678'])('acepta "%s"', (telefono) => {
    expect(validarTelefono(telefono)).toBe('')
  })

  test('rechaza letras', () => {
    expect(validarTelefono('11-abcd-5678')).toBe(
      'El teléfono solo puede contener números, espacios, guiones y el signo +',
    )
  })

  test.each(['1234', '1'.repeat(16)])('rechaza "%s" por la cantidad de números', (telefono) => {
    expect(validarTelefono(telefono)).toBe('El teléfono debe tener entre 8 y 15 números')
  })
})

describe('validarDni', () => {
  test.each(['', '30123456', '30.123.456', '8123456'])('acepta "%s"', (dni) => {
    expect(validarDni(dni)).toBe('')
  })

  test('rechaza letras', () => {
    expect(validarDni('30A23456')).toBe('El DNI solo puede contener números')
  })

  test.each(['123456', '123456789'])('rechaza "%s" por la cantidad de números', (dni) => {
    expect(validarDni(dni)).toBe('El DNI debe tener 7 u 8 números')
  })
})

describe('validarFechaNacimiento', () => {
  const hoy = '2026-09-29'

  test.each(['', '1995-05-20', '2008-09-29'])('acepta "%s"', (fecha) => {
    expect(validarFechaNacimiento(fecha, hoy)).toBe('')
  })

  test('rechaza una fecha futura', () => {
    expect(validarFechaNacimiento('2026-09-30', hoy)).toBe('La fecha de nacimiento no puede ser futura')
  })

  test('rechaza un año imposible', () => {
    expect(validarFechaNacimiento('1850-01-01', hoy)).toBe('Revisá el año de nacimiento')
  })

  test('rechaza un formato inválido', () => {
    expect(validarFechaNacimiento('20/05/1995', hoy)).toBe('La fecha de nacimiento no es válida')
  })
  test('rechaza a un menor de edad', () => {
    expect(validarFechaNacimiento('2010-01-01', hoy)).toBe('Tenés que tener al menos 18 años')
  })

  test('el día antes de cumplir 18, todavía no puede', () => {
    expect(validarFechaNacimiento('2008-09-30', hoy)).toBe('Tenés que tener al menos 18 años')
  })

describe('edadEn', () => {
  test.each([
    ['1995-05-20', 31], // ya cumplió este año
    ['1995-12-01', 30], // todavía no cumplió
    ['2008-09-29', 18], // cumple justo hoy
  ])('nacido el %s tiene %d años', (fecha, edad) => {
    expect(edadEn(fecha, '2026-09-29')).toBe(edad)
  })
})
})