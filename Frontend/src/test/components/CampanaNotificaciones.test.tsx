import { afterEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import CampanaNotificaciones from '../../components/notificaciones/CampanaNotificaciones'
import {
  AccionesNotificacionesContext,
  EstadoNotificacionesContext,
} from '../../context/notificaciones/NotificacionContext'
import type {
  AccionesNotificacionesCliente,
  EstadoNotificacionesCliente,
  NotificacionCliente,
} from '../../types/notificacion.types'

class ObservadorFalso {
  static instancias: ObservadorFalso[] = []
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    ObservadorFalso.instancias.push(this)
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  disparar() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
  ObservadorFalso.instancias = []
  document.body.style.overflow = ''
})

const notificacionPedido: NotificacionCliente = {
  id: 20,
  version: 1,
  tipo: 'pedido.creado',
  ocurridoEn: '2026-01-02T10:05:00.000Z',
  leida: false,
  leidaEn: null,
  datos: {
    pedidoId: 50,
    usuarioId: 7,
    sucursalId: 2,
    estadoAnterior: null,
    estado: 'Pendiente',
    total: 5000,
    fecha: '2026-01-02T10:05:00.000Z',
  },
}

const notificacionSucursal: NotificacionCliente = {
  id: 21,
  version: 1,
  tipo: 'sucursal.cerrada',
  ocurridoEn: '2026-01-02T10:06:00.000Z',
  leida: false,
  leidaEn: null,
  datos: {
    sucursalId: 2,
    sucursalNombre: 'Centro',
  },
}

function estadoCon(
  cambios: Partial<EstadoNotificacionesCliente> = {},
): EstadoNotificacionesCliente {
  return {
    items: [notificacionPedido, notificacionSucursal],
    noLeidas: 2,
    siguienteCursor: null,
    cargandoInicial: false,
    cargandoMas: false,
    marcandoTodas: false,
    error: null,
    hayMas: false,
    noLeidasAlMarcarTodas: null,
    marcaMarcarTodas: null,
    ...cambios,
  }
}

function accionesFalsas(): AccionesNotificacionesCliente {
  return {
    cargarMas: vi.fn(),
    marcarLeida: vi.fn(),
    marcarTodas: vi.fn(),
    reintentar: vi.fn(),
  }
}

function UbicacionActual() {
  const { pathname } = useLocation()
  return <p>{pathname}</p>
}

function renderizar(
  estado: EstadoNotificacionesCliente,
  acciones = accionesFalsas(),
) {
  render(
    <MemoryRouter initialEntries={['/']}>
      <EstadoNotificacionesContext.Provider value={estado}>
        <AccionesNotificacionesContext.Provider value={acciones}>
          <CampanaNotificaciones />
          <UbicacionActual />
        </AccionesNotificacionesContext.Provider>
      </EstadoNotificacionesContext.Provider>
    </MemoryRouter>,
  )

  return acciones
}

describe('CampanaNotificaciones', () => {
  test('muestra el contador accesible y abre el panel', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    const boton = screen.getByRole('button', {
      name: 'Notificaciones, 2 sin leer',
    })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await usuario.click(boton)

    expect(boton).toHaveAttribute('aria-expanded', 'true')
    const panel = screen.getByRole('dialog', { name: 'Notificaciones' })
    expect(panel).toHaveClass('w-96', 'bg-brand-cream')
    expect(screen.getByTestId('backdrop-notificaciones')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Marcar todas' })).toBeInTheDocument()
    expect(screen.queryByText('Estás al día')).not.toBeInTheDocument()
    expect(screen.getByText('Pedido #50 confirmado')).toBeInTheDocument()
    expect(screen.getByText('Centro cerró')).toBeInTheDocument()
  })

  test('en mobile renderiza la vista full-screen sin backdrop', async () => {
    vi.stubGlobal('innerWidth', 375)
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const panel = screen.getByRole('dialog', { name: 'Notificaciones' })
    expect(panel).toHaveClass('inset-0', 'bg-neutral-900')
    expect(panel).not.toHaveClass('w-96')
    expect(
      screen.queryByTestId('backdrop-notificaciones'),
    ).not.toBeInTheDocument()

    await usuario.click(
      screen.getByRole('button', { name: 'Cerrar notificaciones' }),
    )
    expect(
      screen.queryByRole('dialog', { name: 'Notificaciones' }),
    ).not.toBeInTheDocument()
  })

  test('marca una notificación como leída y navega al pedido', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )
    await usuario.click(
      screen.getByRole('button', { name: /Pedido #50 confirmado/ }),
    )

    expect(acciones.marcarLeida).toHaveBeenCalledWith(20)
    expect(screen.getByText('/pedidos/50')).toBeInTheDocument()
    expect(
      screen.queryByRole('dialog', { name: 'Notificaciones' }),
    ).not.toBeInTheDocument()
  })

  test('marca todas como leídas', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )
    await usuario.click(screen.getByRole('button', { name: 'Marcar todas' }))

    expect(acciones.marcarTodas).toHaveBeenCalledTimes(1)
  })

  test('se cierra al tocar el backdrop', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const backdrop = screen.getByTestId('backdrop-notificaciones')
    await usuario.click(backdrop)

    expect(
      screen.queryByRole('dialog', { name: 'Notificaciones' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('backdrop-notificaciones'),
    ).not.toBeInTheDocument()
  })

  test('bloquea la rueda sobre el backdrop sin propagarla', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const backdrop = screen.getByTestId('backdrop-notificaciones')
    const enDocumento = vi.fn()
    document.addEventListener('wheel', enDocumento)

    const evento = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    })
    fireEvent(backdrop, evento)
    document.removeEventListener('wheel', enDocumento)

    expect(evento.defaultPrevented).toBe(true)
    expect(enDocumento).not.toHaveBeenCalled()
  })

  test('bloquea la rueda sobre el header sin propagarla', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const header = screen.getByRole('heading', { name: 'Notificaciones' })
    const enDocumento = vi.fn()
    document.addEventListener('wheel', enDocumento)

    const evento = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    })
    fireEvent(header, evento)
    document.removeEventListener('wheel', enDocumento)

    expect(evento.defaultPrevented).toBe(true)
    expect(enDocumento).not.toHaveBeenCalled()
  })

  test('permite la rueda sobre la lista interna', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const lista = screen.getByRole('list')
    const enDocumento = vi.fn()
    document.addEventListener('wheel', enDocumento)

    const evento = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaY: 120,
    })
    fireEvent(lista, evento)
    document.removeEventListener('wheel', enDocumento)

    expect(evento.defaultPrevented).toBe(false)
    expect(enDocumento).toHaveBeenCalledTimes(1)
  })

  test('bloquea touchmove sobre el header sin propagarla', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const header = screen.getByTestId('header-notificaciones')
    expect(header).toHaveClass('touch-none')

    const enDocumento = vi.fn()
    document.addEventListener('touchmove', enDocumento)

    const evento = new Event('touchmove', {
      bubbles: true,
      cancelable: true,
    })
    fireEvent(header, evento)
    document.removeEventListener('touchmove', enDocumento)

    expect(evento.defaultPrevented).toBe(true)
    expect(enDocumento).not.toHaveBeenCalled()
  })

  test('permite touchmove sobre la lista interna', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )

    const lista = screen.getByRole('list')
    const enDocumento = vi.fn()
    document.addEventListener('touchmove', enDocumento)

    const evento = new Event('touchmove', {
      bubbles: true,
      cancelable: true,
    })
    fireEvent(lista, evento)
    document.removeEventListener('touchmove', enDocumento)

    expect(evento.defaultPrevented).toBe(false)
    expect(enDocumento).toHaveBeenCalledTimes(1)
  })

  test('bloquea el scroll de la página mientras está abierto', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )
    expect(document.body.style.overflow).toBe('hidden')

    await usuario.click(screen.getByTestId('backdrop-notificaciones'))
    expect(document.body.style.overflow).toBe('')
  })

  test('se cierra con Escape y devuelve el foco a la campana', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    const boton = screen.getByRole('button', {
      name: 'Notificaciones, 2 sin leer',
    })
    await usuario.click(boton)
    await usuario.keyboard('{Escape}')

    expect(
      screen.queryByRole('dialog', { name: 'Notificaciones' }),
    ).not.toBeInTheDocument()
    expect(boton).toHaveFocus()
  })

  test('pide la siguiente página al llegar al final del scroll', async () => {
    const usuario = userEvent.setup()
    vi.stubGlobal('IntersectionObserver', ObservadorFalso)
    const acciones = renderizar(
      estadoCon({ siguienteCursor: 'cursor-siguiente' }),
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones, 2 sin leer' }),
    )
    await waitFor(() => {
      expect(ObservadorFalso.instancias).toHaveLength(1)
    })

    expect(
      screen.queryByRole('button', { name: 'Ver más' }),
    ).not.toBeInTheDocument()

    ObservadorFalso.instancias[0]?.disparar()
    expect(acciones.cargarMas).toHaveBeenCalledTimes(1)
  })

  test('muestra el error y permite reintentar', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(
      estadoCon({ items: [], noLeidas: null, error: 'Sin conexión' }),
    )

    await usuario.click(
      screen.getByRole('button', { name: 'Notificaciones' }),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(acciones.reintentar).toHaveBeenCalledTimes(1)
  })
})
