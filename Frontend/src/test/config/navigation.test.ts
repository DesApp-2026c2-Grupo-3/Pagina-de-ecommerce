import { describe, expect, test } from 'vitest'
import { NAV_LINKS } from '../../config/navigation'

describe('NAV_LINKS', () => {
  const nosotros = NAV_LINKS.find((link) => link.to === '/conocenos')

  test('Nosotros tiene un submenú con sus secciones', () => {
    expect(nosotros?.submenu?.length).toBeGreaterThan(0)
  })

  test('cada entrada del submenú apunta a una sección de /conocenos', () => {
    for (const sub of nosotros?.submenu ?? []) {
      expect(sub.to).toMatch(/^\/conocenos#[a-z-]+$/)
    }
  })

  test('el submenú no repite secciones', () => {
    const destinos = (nosotros?.submenu ?? []).map((sub) => sub.to)
    expect(new Set(destinos).size).toBe(destinos.length)
  })

  test('los demás links no tienen submenú', () => {
    expect(NAV_LINKS.filter((link) => link !== nosotros && link.submenu)).toEqual([])
  })
})
