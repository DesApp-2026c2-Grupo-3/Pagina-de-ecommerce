import { describe, expect, it } from 'vitest'
import { imagenOptimizada } from '../../utils/imagen'

const CLOUD = 'https://res.cloudinary.com/demo/image/upload'

describe('imagenOptimizada', () => {
  it('pide a Cloudinary el formato y la calidad automáticos, con el ancho indicado', () => {
    expect(imagenOptimizada(`${CLOUD}/v1700/Productos/Fast-Classic.png`, 400)).toBe(
      `${CLOUD}/f_auto,q_auto,w_400/v1700/Productos/Fast-Classic.png`,
    )
  })

  it('funciona también sin número de versión', () => {
    expect(imagenOptimizada(`${CLOUD}/Productos/Latte.png`, 600)).toBe(`${CLOUD}/f_auto,q_auto,w_600/Productos/Latte.png`)
  })

  it('redondea el ancho', () => {
    expect(imagenOptimizada(`${CLOUD}/v1/a.png`, 399.6)).toContain('w_400')
  })

  it('no toca una URL que ya trae transformaciones', () => {
    const url = `${CLOUD}/f_auto,q_auto,w_300/v1/a.png`
    expect(imagenOptimizada(url, 600)).toBe(url)
    expect(imagenOptimizada(`${CLOUD}/w_300/v1/a.png`, 600)).toBe(`${CLOUD}/w_300/v1/a.png`)
  })

  it('no toca las fotos locales ni las de otros sitios', () => {
    expect(imagenOptimizada('/imagenes/Hamburguesas/clasica.png', 400)).toBe('/imagenes/Hamburguesas/clasica.png')
    expect(imagenOptimizada('https://otro.com/foto.png', 400)).toBe('https://otro.com/foto.png')
  })

  it('devuelve tal cual lo que no es una URL (vacío o nulo)', () => {
    expect(imagenOptimizada(null, 400)).toBeNull()
    expect(imagenOptimizada(undefined, 400)).toBeUndefined()
    expect(imagenOptimizada('', 400)).toBe('')
  })
})
