import { describe, expect, test } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTituloConNoLeidas } from '../../hooks/useTituloConNoLeidas'

describe('useTituloConNoLeidas (C-4)', () => {
  test('pone el número de no leídas delante del nombre y lo saca al llegar a cero', () => {
    const { rerender } = renderHook(({ n }: { n: number | null }) => useTituloConNoLeidas(n), {
      initialProps: { n: 2 as number | null },
    })
    expect(document.title).toBe('(2) BurgerFast')

    rerender({ n: 150 })
    expect(document.title).toBe('(99+) BurgerFast')

    rerender({ n: 0 })
    expect(document.title).toBe('BurgerFast')

    rerender({ n: null })
    expect(document.title).toBe('BurgerFast')
  })
})
