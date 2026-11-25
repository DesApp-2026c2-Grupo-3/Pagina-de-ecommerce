import { describe, expect, it } from 'vitest'
import { MOTIVOS_CANCELACION_FRECUENTES } from '../../config/pedidos'
import { ERROR_MOTIVO_CANCELACION, validarMotivoCancelacion } from '../../utils/pedidos/motivoCancelacion'

describe('validarMotivoCancelacion (misma regla que el backend: 3 a 200 caracteres)', () => {
  it('rechaza vacío, solo espacios y menos de 3 caracteres', () => {
    for (const texto of ['', '    ', 'no', '  no  ']) {
      expect(validarMotivoCancelacion(texto)).toMatchObject({ error: ERROR_MOTIVO_CANCELACION })
    }
  })
  it('acepta 3 caracteres y devuelve el texto sin espacios en los bordes', () => {
    expect(validarMotivoCancelacion('  sin  ')).toEqual({ motivo: 'sin', error: '' })
  })
  it('acepta 200 caracteres y rechaza 201', () => {
    expect(validarMotivoCancelacion('a'.repeat(200)).error).toBe('')
    expect(validarMotivoCancelacion('a'.repeat(201)).error).toBe(ERROR_MOTIVO_CANCELACION)
  })
  it('los 5 motivos frecuentes son válidos', () => {
    expect(MOTIVOS_CANCELACION_FRECUENTES).toHaveLength(5)
    for (const m of MOTIVOS_CANCELACION_FRECUENTES) expect(validarMotivoCancelacion(m).error).toBe('')
  })
})
