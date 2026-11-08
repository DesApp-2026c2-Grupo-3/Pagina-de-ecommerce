import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CarruselFlechas from '../../components/ui/CarruselFlechas'

// jsdom no calcula medidas: se simulan las de la pista para probar las flechas
function medir(pista: HTMLElement, { scrollLeft, scrollWidth, clientWidth }: { scrollLeft: number; scrollWidth: number; clientWidth: number }) {
  Object.defineProperty(pista, 'scrollLeft', { value: scrollLeft, configurable: true, writable: true })
  Object.defineProperty(pista, 'scrollWidth', { value: scrollWidth, configurable: true })
  Object.defineProperty(pista, 'clientWidth', { value: clientWidth, configurable: true })
}

function renderizar() {
  render(
    <CarruselFlechas etiqueta="Los más pedidos">
      <div>Uno</div>
      <div>Dos</div>
      <div>Tres</div>
    </CarruselFlechas>,
  )
  const pista = screen.getByText('Uno').parentElement as HTMLElement
  pista.scrollBy = vi.fn() as unknown as typeof pista.scrollBy
  return pista
}

beforeEach(() => vi.clearAllMocks())

describe('CarruselFlechas', () => {
  test('es una región con nombre y muestra sus tarjetas', () => {
    renderizar()
    expect(screen.getByRole('region', { name: 'Los más pedidos' })).toBeInTheDocument()
    expect(screen.getByText('Tres')).toBeInTheDocument()
  })

  test('al principio solo se puede ir a la derecha', () => {
    const pista = renderizar()
    medir(pista, { scrollLeft: 0, scrollWidth: 900, clientWidth: 300 })
    pista.dispatchEvent(new Event('scroll'))

    return vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ver anteriores' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Ver siguientes' })).toBeEnabled()
    })
  })

  test('en el medio se puede ir para los dos lados y al final solo para atrás', async () => {
    const pista = renderizar()

    medir(pista, { scrollLeft: 300, scrollWidth: 900, clientWidth: 300 })
    pista.dispatchEvent(new Event('scroll'))
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ver anteriores' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Ver siguientes' })).toBeEnabled()
    })

    medir(pista, { scrollLeft: 600, scrollWidth: 900, clientWidth: 300 })
    pista.dispatchEvent(new Event('scroll'))
    await vi.waitFor(() => {
      expect(screen.getByRole('button', { name: 'Ver anteriores' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Ver siguientes' })).toBeDisabled()
    })
  })

  test('las flechas desplazan la pista', async () => {
    const usuario = userEvent.setup()
    const pista = renderizar()
    medir(pista, { scrollLeft: 300, scrollWidth: 900, clientWidth: 300 })
    pista.dispatchEvent(new Event('scroll'))
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Ver siguientes' })).toBeEnabled())

    await usuario.click(screen.getByRole('button', { name: 'Ver siguientes' }))
    expect(pista.scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: expect.any(Number), behavior: 'smooth' }))
    expect(vi.mocked(pista.scrollBy).mock.calls[0][0]).toMatchObject({ left: expect.any(Number) })
    expect((vi.mocked(pista.scrollBy).mock.calls[0][0] as ScrollToOptions).left).toBeGreaterThan(0)

    await usuario.click(screen.getByRole('button', { name: 'Ver anteriores' }))
    expect((vi.mocked(pista.scrollBy).mock.calls[1][0] as ScrollToOptions).left).toBeLessThan(0)
  })
})
