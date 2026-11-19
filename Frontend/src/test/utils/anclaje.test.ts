import { describe, expect, test } from 'vitest'
import { anclajeDebajoDe } from '../../utils/anclaje'

const rect = (bottom: number, right: number) => ({ bottom, right }) as DOMRect

describe('anclajeDebajoDe', () => {
  test('cuelga 12 px debajo del botón, alineado a su borde derecho', () => {
    expect(anclajeDebajoDe(rect(60, 1000), 1280)).toEqual({ top: 72, right: 280 })
  })

  test('no se pega al borde de la pantalla', () => {
    expect(anclajeDebajoDe(rect(60, 1278), 1280)).toEqual({ top: 72, right: 12 })
  })
})
