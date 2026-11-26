import { describe, expect, test } from 'vitest'

import { altoPanel, anchoPanel, siguienteIndice, ubicarPanel } from '../../utils/listas/menuDesplegable'
import { formatearContador } from '../../utils/listas/formatoContador'

const rect = (left: number, top: number, width: number, height = 44) => ({ left, top, width, right: left + width, bottom: top + height })

describe('teclado del menú de filtros', () => {
  test('flechas, Home y End sin dar la vuelta', () => {
    expect(siguienteIndice(0, 5, 'ArrowDown')).toBe(1)
    expect(siguienteIndice(4, 5, 'ArrowDown')).toBe(4)
    expect(siguienteIndice(0, 5, 'ArrowUp')).toBe(0)
    expect(siguienteIndice(3, 5, 'Home')).toBe(0)
    expect(siguienteIndice(1, 5, 'End')).toBe(4)
    expect(siguienteIndice(2, 5, 'a')).toBe(2)
    expect(siguienteIndice(0, 0, 'ArrowDown')).toBe(-1)
  })
})

describe('el panel siempre dentro de la pantalla', () => {
  test('ancho: mínimo 16 rem o el botón, máximo la pantalla menos 2 rem', () => {
    expect(anchoPanel(171, 390)).toBe(256)
    expect(anchoPanel(300, 1280)).toBe(300)
    expect(anchoPanel(171, 280)).toBe(248)
  })

  test('alto: lo que piden las opciones, con tope', () => {
    expect(altoPanel(4, 900)).toBe(4 * 44 + 44)
    expect(altoPanel(20, 900)).toBe(352)
    expect(altoPanel(7, 400)).toBe(240)
  })

  test('móvil: el filtro de la derecha se alinea a su borde derecho; el de la izquierda, a su izquierda', () => {
    const ventana = { ancho: 390, alto: 844 }
    expect(ubicarPanel(rect(203, 160, 171), 7, ventana).alineadoIzquierda).toBe(false)
    expect(ubicarPanel(rect(16, 160, 171), 3, ventana).alineadoIzquierda).toBe(true)
  })

  test('abre hacia arriba solo si abajo no entra y arriba hay más lugar', () => {
    const ventana = { ancho: 1024, alto: 700 }
    expect(ubicarPanel(rect(600, 120, 224), 7, ventana).haciaArriba).toBe(false)
    expect(ubicarPanel(rect(600, 600, 224), 7, ventana).haciaArriba).toBe(true)
  })

  test('los contadores siguen con «99+»', () => {
    expect(formatearContador(128)).toBe('99+')
  })
})
