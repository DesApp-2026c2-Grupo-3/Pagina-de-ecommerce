import { describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import NavegacionInferior from '../../../components/layout/NavegacionInferior'
import NavegacionSuperior from '../../../components/layout/NavegacionSuperior'

function dibujar(
  ruta: string,
  {
    noLeidas = 0,
    pedidosParaTomar = null as number | null,
    avisosAbiertos = false,
    onAbrirAvisos = () => {},
  } = {},
) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <NavegacionInferior
        noLeidas={noLeidas}
        pedidosParaTomar={pedidosParaTomar}
        avisosAbiertos={avisosAbiertos}
        onAbrirAvisos={onAbrirAvisos}
      />
    </MemoryRouter>,
  )
  return screen.getByRole('navigation', { name: 'Principal' })
}

describe('NavegacionInferior', () => {
  test('tiene los 4 destinos', () => {
    const barra = dibujar('/')

    const nombres = within(barra).getAllByRole('link').map((enlace) => enlace.textContent)
    expect(nombres).toEqual(['Inicio', 'Pedidos', 'Mi viaje', 'Historial'])
  })

  test('marca la pantalla actual', () => {
    const barra = dibujar('/viaje')

    expect(within(barra).getByRole('link', { name: 'Mi viaje' })).toHaveAttribute('aria-current', 'page')
    expect(within(barra).getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current')
  })

  test('quinta pestaña "Avisos": abre la bandeja y lleva el contador', async () => {
    const onAbrirAvisos = vi.fn()
    const barra = dibujar('/', { noLeidas: 4, onAbrirAvisos })

    const avisos = within(barra).getByRole('button', { name: 'Avisos, 4 sin leer' })
    expect(avisos).toHaveAttribute('aria-haspopup', 'dialog')
    expect(avisos).toHaveAttribute('aria-expanded', 'false')
    expect(avisos).toHaveClass('h-16')

    await userEvent.click(avisos)
    expect(onAbrirAvisos).toHaveBeenCalledTimes(1)
  })

  test('con la bandeja abierta, "Avisos" se marca', () => {
    const barra = dibujar('/', { avisosAbiertos: true })

    expect(within(barra).getByRole('button', { name: 'Avisos' })).toHaveAttribute('aria-expanded', 'true')
  })

  test('Pedidos muestra cuántos hay para tomar (v1.7), en naranja y en su nombre accesible', () => {
    const barra = dibujar('/', { pedidosParaTomar: 3 })

    const pedidos = within(barra).getByRole('link', { name: 'Pedidos, 3 disponibles' })
    expect(within(pedidos).getByTestId('insignia')).toHaveTextContent('3')
    expect(within(pedidos).getByTestId('insignia')).toHaveClass('bg-orange-700')
  })

  test.each([null, 0])('sin pedidos para tomar (%s) no hay contador', (pedidosParaTomar) => {
    const barra = dibujar('/', { pedidosParaTomar })

    expect(within(barra).getByRole('link', { name: 'Pedidos' })).toBeInTheDocument()
    expect(within(barra).queryByTestId('insignia')).not.toBeInTheDocument()
  })

  test('solo en el celular, fija abajo y con áreas táctiles de 64 px', () => {
    const barra = dibujar('/')

    expect(barra).toHaveClass('fixed', 'bottom-0', 'md:hidden')
    expect(within(barra).getByRole('link', { name: 'Inicio' })).toHaveClass('h-16')
  })
})

describe('NavegacionSuperior', () => {
  test('solo en escritorio, con los mismos destinos', () => {
    render(
      <MemoryRouter initialEntries={['/pedidos']}>
        <NavegacionSuperior pedidosParaTomar={null} />
      </MemoryRouter>,
    )

    const barra = screen.getByRole('navigation', { name: 'Principal' })
    expect(barra).toHaveClass('hidden', 'md:block')
    expect(within(barra).getByRole('link', { name: 'Pedidos' })).toHaveAttribute('aria-current', 'page')
  })

  test('la pestaña Pedidos también lleva el contador', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <NavegacionSuperior pedidosParaTomar={1} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Pedidos, 1 disponible' })).toHaveTextContent('Pedidos1')
  })
})
