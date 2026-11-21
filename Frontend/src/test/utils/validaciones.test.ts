import { describe, expect, test } from 'vitest'
import { esEmailValido } from '../../utils/validaciones'

describe('esEmailValido', () => {
  test.each(['juan@gmail.com', 'ana.perez@empresa.com.ar', 'user+promo@mail.co'])('acepta "%s"', (email) => {
    expect(esEmailValido(email)).toBe(true)
  })

  test.each([
    ['vacío', ''],
    ['sin arroba', 'juangmail.com'],
    ['sin dominio', 'juan@'],
    ['sin punto en el dominio', 'juan@gmail'],
    ['con espacios', 'juan perez@gmail.com'],
    ['con dos arrobas', 'juan@@gmail.com'],
  ])('rechaza un email %s', (_, email) => {
    expect(esEmailValido(email)).toBe(false)
  })
})