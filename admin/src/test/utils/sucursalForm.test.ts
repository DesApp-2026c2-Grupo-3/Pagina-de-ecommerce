import { describe, expect, test } from 'vitest'

import { aPedido, desdeSucursal, sucursalVacia, validarPaso } from '../../utils/sucursalForm'
import { horarioPorDefecto } from '../../utils/horario'
import type { DatosSucursal, HorarioTurno, Sucursal } from '../../types/sucursal.types'

const turno = (apertura: string, cierre: string, cruzaMedianoche = false): HorarioTurno => ({
  apertura,
  cierre,
  cruzaMedianoche,
})

// Un formulario completo y válido, con los cambios que pida cada test
const formulario = (cambios: Partial<DatosSucursal> = {}): DatosSucursal => ({
  nombre: 'Sucursal Centro',
  telefono: '+54 11 4555-1234',
  horario: horarioPorDefecto(),
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  ubicacion: {
    calle: 'Av. Corrientes',
    numero: '1234',
    localidad: 'CABA',
    provincia: 'Buenos Aires',
    codigoPostal: 'C1043',
    latitud: -34.6037,
    longitud: -58.3816,
  },
  ...cambios,
})

const conUbicacion = (cambios: Partial<DatosSucursal['ubicacion']>) =>
  formulario({ ubicacion: { ...formulario().ubicacion, ...cambios } })

describe('sucursalVacia', () => {
  test('arranca vacía, abierta todos los días y en la hora de Buenos Aires', () => {
    const datos = sucursalVacia()

    expect(datos.nombre).toBe('')
    expect(datos.horario).toEqual(horarioPorDefecto())
    expect(datos.zonaHoraria).toBe('America/Argentina/Buenos_Aires')
    expect(datos.ubicacion.latitud).toBeNull()
  })

  test('devuelve un formulario nuevo cada vez', () => {
    const primera = sucursalVacia()
    primera.horario.lunes.abierto = false

    expect(sucursalVacia().horario.lunes.abierto).toBe(true)
  })
})

describe('desdeSucursal (del backend al formulario)', () => {
  test('carga los datos de la sucursal', () => {
    const sucursal: Sucursal = {
      id: 2,
      nombre: 'Centro',
      activa: true,
      telefono: '4555-1234',
      horario: { lunes: { abierto: false, turnos: [] } },
      zona_horaria: 'America/Argentina/Cordoba',
      calle: 'Av. Corrientes',
      numero: '1234',
      localidad: 'CABA',
      provincia: 'Buenos Aires',
      codigoPostal: 'C1043',
      latitud: '-34.6037', // Postgres devuelve los DECIMAL como texto
      longitud: -58.3816,
    }

    const datos = desdeSucursal(sucursal)

    expect(datos.nombre).toBe('Centro')
    expect(datos.zonaHoraria).toBe('America/Argentina/Cordoba')
    expect(datos.horario.lunes.abierto).toBe(false)
    expect(datos.horario.martes.abierto).toBe(true)
    expect(datos.ubicacion).toMatchObject({ calle: 'Av. Corrientes', latitud: -34.6037, longitud: -58.3816 })
  })

  test('completa los datos que faltan con valores vacíos o por defecto', () => {
    const datos = desdeSucursal({ id: 2, nombre: 'Centro', activa: true, zona_horaria: '  ' })

    expect(datos.telefono).toBe('')
    expect(datos.zonaHoraria).toBe('America/Argentina/Buenos_Aires')
    expect(datos.horario).toEqual(horarioPorDefecto())
    expect(datos.ubicacion).toMatchObject({ calle: '', numero: '', latitud: null, longitud: null })
  })
})

describe('aPedido (del formulario al backend)', () => {
  test('arma los datos con las claves que espera el backend y sin espacios de más', () => {
    const pedido = aPedido(formulario({ nombre: '  Sucursal Centro  ', zonaHoraria: ' America/Argentina/Cordoba ' }))

    expect(pedido).toMatchObject({
      nombre: 'Sucursal Centro',
      zona_horaria: 'America/Argentina/Cordoba',
      calle: 'Av. Corrientes',
      latitud: -34.6037,
    })
  })

  test('un día cerrado se envía sin turnos', () => {
    const datos = formulario()
    datos.horario.lunes = { abierto: false, turnos: [turno('09:00', '18:00')] }

    expect(aPedido(datos).horario.lunes).toEqual({ abierto: false, turnos: [] })
  })

  test('envía como máximo 2 turnos por día', () => {
    const datos = formulario()
    datos.horario.martes = {
      abierto: true,
      turnos: [turno('08:00', '10:00'), turno('11:00', '13:00'), turno('14:00', '16:00')],
    }

    expect(aPedido(datos).horario.martes.turnos).toHaveLength(2)
  })
})

describe('validarPaso', () => {
  test.each([1, 2, 3])('un formulario completo no tiene errores en el paso %s', (paso) => {
    expect(validarPaso(paso, formulario())).toBe('')
  })

  describe('paso 1: datos generales', () => {
    test('exige un nombre de al menos 3 caracteres', () => {
      expect(validarPaso(1, formulario({ nombre: ' AB ' }))).toBe('El nombre debe tener al menos 3 caracteres.')
    })

    test('rechaza un teléfono con letras', () => {
      expect(validarPaso(1, formulario({ telefono: '4555-ABCD' }))).toBe(
        'El teléfono solo puede contener números, espacios, guiones y el signo +.',
      )
    })

    test('el teléfono es opcional', () => {
      expect(validarPaso(1, formulario({ telefono: '' }))).toBe('')
    })
  })

  describe('paso 2: horario', () => {
    test('informa el error del horario', () => {
      const datos = formulario()
      datos.horario.lunes = { abierto: true, turnos: [] }

      expect(validarPaso(2, datos)).toBe('El lunes está abierto y debe tener al menos un turno.')
    })

    test('exige una zona horaria válida', () => {
      expect(validarPaso(2, formulario({ zonaHoraria: 'Marte/Base' }))).toBe('Elegí una zona horaria válida.')
    })
  })

  describe('paso 3: ubicación', () => {
    test('exige la calle y la altura', () => {
      expect(validarPaso(3, conUbicacion({ numero: '' }))).toBe('Buscá y elegí la dirección de la sucursal, con altura.')
    })

    test('exige la ubicación en el mapa', () => {
      expect(validarPaso(3, conUbicacion({ latitud: null }))).toBe('Marcá la ubicación en el mapa.')
    })

    test('exige la localidad y la provincia', () => {
      expect(validarPaso(3, conUbicacion({ provincia: '' }))).toBe(
        'La dirección elegida no tiene localidad o provincia. Probá con otra búsqueda.',
      )
    })
  })

  test('un paso que no existe no tiene validaciones', () => {
    expect(validarPaso(4, formulario({ nombre: '' }))).toBe('')
  })
})