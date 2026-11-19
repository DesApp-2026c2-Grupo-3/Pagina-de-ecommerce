import { describe, expect, test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useBloquearScroll } from '../../hooks/useBloquearScroll'

const html = () => document.documentElement.style.overflow

describe('useBloquearScroll', () => {
  test('bloquea <html> mientras está activo y deja <body> como estaba', () => {
    const { rerender } = renderHook(({ activo }) => useBloquearScroll(activo), {
      initialProps: { activo: true },
    })
    expect(html()).toBe('hidden')
    expect(document.body.style.overflow).toBe('')

    rerender({ activo: false })
    expect(html()).toBe('')
  })

  test('con dos modales abiertos, cerrar uno no libera el scroll (bandeja + Cambiar zona)', () => {
    const bandeja = renderHook(() => useBloquearScroll(true))
    const zona = renderHook(() => useBloquearScroll(true))

    bandeja.unmount()
    expect(html()).toBe('hidden')

    zona.unmount()
    expect(html()).toBe('')
  })
})
