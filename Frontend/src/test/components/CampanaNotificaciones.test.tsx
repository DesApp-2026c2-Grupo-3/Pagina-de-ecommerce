import { afterEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
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

afterEach(() => {
  vi.unstubAllGlobals()
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
    errorCarga: null,
    errorAccion: null,
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

// Muestra la ruta actual y permite navegar desde afuera de la campana
function Ubicacion() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <p>{pathname}</p>
      <button type="button" onClick={() => navigate('/promociones')}>
        Ir a promociones
      </button>
    </>
  )
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
          <Ubicacion />
        </AccionesNotificacionesContext.Provider>
      </EstadoNotificacionesContext.Provider>
    </MemoryRouter>,
  )

  return acciones
}

const campana = (nombre = 'Notificaciones, 2 sin leer') =>
  screen.getByRole('button', { name: nombre })

const bandeja = () => screen.queryByRole('dialog', { name: 'Notificaciones' })

describe('CampanaNotificaciones y BandejaNotificaciones (<dialog> nativo)', () => {
  test('abre la bandeja como diálogo y muestra los avisos', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    expect(campana()).toHaveAttribute('aria-expanded', 'false')
    expect(bandeja()).not.toBeInTheDocument()

    await usuario.click(campana())

    expect(campana()).toHaveAttribute('aria-expanded', 'true')
    expect(bandeja()).toHaveAttribute('open')
    expect(screen.getByText('Pedido #50 confirmado')).toBeInTheDocument()
    expect(screen.getByText('Centro cerró')).toBeInTheDocument()
  })

  test('al abrir, el foco entra a la bandeja (botón Cerrar)', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())

    expect(screen.getByRole('button', { name: 'Cerrar notificaciones' })).toHaveFocus()
  })

  test('en escritorio queda anclada debajo de la campana', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())

    const dialogo = bandeja()!
    expect(dialogo).toHaveClass('w-96', 'bg-brand-cream')
    expect(dialogo.style.top).not.toBe('')
    expect(dialogo.style.right).not.toBe('')
  })

  test('en el celular es una hoja inferior crema y se cierra con la X (C-4)', async () => {
    vi.stubGlobal('innerWidth', 375)
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())

    const dialogo = bandeja()!
    expect(dialogo).toHaveClass('bottom-0', 'h-[85dvh]', 'bg-brand-cream', 'rounded-t-3xl')
    expect(dialogo.style.top).toBe('')

    await usuario.click(screen.getByRole('button', { name: 'Cerrar notificaciones' }))
    expect(bandeja()).not.toBeInTheDocument()
    expect(campana()).toHaveAttribute('aria-expanded', 'false')
  })

  test('bloquea el scroll de <html> (no de <body>) mientras está abierta (plan, 36.2)', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())
    expect(document.documentElement.style.overflow).toBe('hidden')
    expect(document.body.style.overflow).toBe('')

    await usuario.click(screen.getByRole('button', { name: 'Cerrar notificaciones' }))
    expect(document.documentElement.style.overflow).toBe('')
    expect(document.body.style.overflow).toBe('')
  })

  test('Escape (evento cancel) la cierra', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())
    const cancelar = new Event('cancel', { cancelable: true })
    fireEvent(bandeja()!, cancelar)

    expect(cancelar.defaultPrevented).toBe(true)
    expect(bandeja()).not.toBeInTheDocument()
  })

  test('tocar el fondo la cierra; tocar el contenido no', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())
    await usuario.click(screen.getByRole('heading', { name: 'Notificaciones' }))
    expect(bandeja()).toBeInTheDocument()

    // Un toque en el fondo (::backdrop) llega al propio <dialog>
    fireEvent.click(bandeja()!)
    expect(bandeja()).not.toBeInTheDocument()
  })

  test('se cierra al cambiar de pantalla', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())
    // En el navegador el fondo está inerte; acá se navega desde afuera para simular un cambio de ruta
    fireEvent.click(screen.getByRole('button', { name: 'Ir a promociones', hidden: true }))

    expect(screen.getByText('/promociones')).toBeInTheDocument()
    expect(bandeja()).not.toBeInTheDocument()
    expect(campana()).toHaveAttribute('aria-expanded', 'false')
  })

  test('marca una notificación como leída y navega al pedido', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(estadoCon())

    await usuario.click(campana())
    await usuario.click(screen.getByRole('button', { name: /Pedido #50 confirmado/ }))

    expect(acciones.marcarLeida).toHaveBeenCalledWith(20)
    expect(screen.getByText('/pedidos/50')).toBeInTheDocument()
    expect(bandeja()).not.toBeInTheDocument()
  })

  test('marca todas como leídas', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(estadoCon())

    await usuario.click(campana())
    await usuario.click(screen.getByRole('button', { name: 'Marcar todas' }))

    expect(acciones.marcarTodas).toHaveBeenCalledTimes(1)
  })

  test('«Ver anteriores» pide la página siguiente (plan, DC-2)', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(estadoCon({ siguienteCursor: 'cursor-siguiente' }))

    await usuario.click(campana())
    await usuario.click(screen.getByRole('button', { name: 'Ver anteriores' }))

    expect(acciones.cargarMas).toHaveBeenCalledTimes(1)
  })

  test('sin más páginas no hay «Ver anteriores»', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon())

    await usuario.click(campana())
    expect(screen.queryByRole('button', { name: 'Ver anteriores' })).not.toBeInTheDocument()
  })

  test('un error de carga se muestra con «Reintentar» (plan, B-6)', async () => {
    const usuario = userEvent.setup()
    const acciones = renderizar(
      estadoCon({ errorCarga: { origen: 'mas', mensaje: 'Sin conexión' } }),
    )

    await usuario.click(campana())
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')

    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(acciones.reintentar).toHaveBeenCalledTimes(1)
  })

  test('el error de una acción se informa sin «Reintentar» (plan, B-6)', async () => {
    const usuario = userEvent.setup()
    renderizar(estadoCon({ errorAccion: 'No se pudo marcar la notificación como leída' }))

    await usuario.click(campana())

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo marcar la notificación como leída')
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument()
  })
})
