import { describe, expect, test } from 'vitest'

import { normalizarMotivoRevocacion } from '../../realtime/realtimeEvents'

describe('normalizarMotivoRevocacion', () => {
  test.each(['baja', 'asistencia'] as const)('respeta el motivo "%s"', (motivo) => {
    expect(normalizarMotivoRevocacion({ motivo })).toBe(motivo)
  })

  test.each([{ motivo: 'desactivado' }, { motivo: 'otro' }, null, 'baja'])('cualquier otra cosa es "desactivado" (%o)', (valor) => {
    expect(normalizarMotivoRevocacion(valor)).toBe('desactivado')
  })
})
