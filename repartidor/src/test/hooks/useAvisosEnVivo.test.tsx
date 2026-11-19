import { describe, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useAvisosEnVivo } from '../../hooks/useAvisosEnVivo'
import { ToastProvider } from '../../context/toasts/ToastProvider'
import ContenedorToasts from '../../components/toasts/ContenedorToasts'
import { crearRealtimeDePrueba } from '../apoyoRealtime'
import { crearNotificacionesDePrueba } from '../apoyoNotificaciones'
import { estadoCon } from '../fixturesNotificaciones'

// Así llega del socket (mismo formato que la bandeja REST)
const payload = (id: number, tipo: string, datos: Record<string, unknown>) => ({
  id, tipo, version: 1, ocurridoEn: '2026-11-17T10:00:00.000Z', leida: false, leidaEn: null, datos,
})

const ASIGNADO = payload(12, 'viaje.asignado', { viajeId: 87, cantidadPedidos: 3 })

function Pantalla({ alAbrir }: { alAbrir?: () => void }) {
  useAvisosEnVivo(alAbrir)
  return <ContenedorToasts />
}

function montar() {
  const { Proveedor: Realtime, emitir } = crearRealtimeDePrueba()
  const { Proveedor: Notificaciones, acciones } = crearNotificacionesDePrueba(estadoCon({}))
  const alAbrir = vi.fn()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Realtime>
        <ToastProvider>
          <Notificaciones>
            <Pantalla alAbrir={alAbrir} />
            <Routes>
              <Route path="/" element={<p>Pantalla: inicio</p>} />
              <Route path="/viaje" element={<p>Pantalla: viaje</p>} />
              <Route path="/pedidos" element={<p>Pantalla: pedidos</p>} />
            </Routes>
          </Notificaciones>
        </ToastProvider>
      </Realtime>
    </MemoryRouter>,
  )

  return { emitir: (valor: unknown) => act(() => emitir({ tipo: 'notificacion', payload: valor })), emitirEvento: emitir, acciones, alAbrir }
}

describe('useAvisosEnVivo', () => {
  test('un aviso en vivo genera un toast con el texto y la acción de su estrategia', () => {
    const { emitir } = montar()
    emitir(ASIGNADO)

    expect(screen.getByRole('alert')).toHaveTextContent('Te asignaron el viaje #87')
    expect(screen.getByRole('button', { name: 'Ver viaje' })).toBeInTheDocument()
  })

  test('la acción depende de los datos: pedido cancelado que vació el viaje → "Ver pedidos"', () => {
    const { emitir } = montar()
    emitir(payload(13, 'pedido.cancelado_en_viaje', { pedidoId: 1045, viajeId: 87, viajeEliminado: true }))

    expect(screen.getByRole('alert')).toHaveTextContent('Se canceló el pedido #1045')
    expect(screen.getByRole('button', { name: 'Ver pedidos' })).toBeInTheDocument()
  })

  test('el mismo aviso dos veces genera un solo toast, aunque el primero ya se haya cerrado', async () => {
    const { emitir } = montar()
    emitir(ASIGNADO)
    emitir(ASIGNADO)
    expect(screen.getAllByRole('alert')).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Ver viaje' }))
    emitir(ASIGNADO)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('un payload inválido o de un tipo desconocido no genera toast', () => {
    const { emitir } = montar()
    emitir({ ...ASIGNADO, datos: {} })
    emitir(payload(14, 'tipo.desconocido', {}))

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('volver a primer plano o reconectar no genera toasts (solo recargan la bandeja)', () => {
    const { emitirEvento } = montar()
    act(() => {
      emitirEvento({ tipo: 'visible' })
      emitirEvento({ tipo: 'reconexion' })
    })

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('tocar la acción marca leído, cierra la bandeja, navega y cierra el toast', async () => {
    const { emitir, acciones, alAbrir } = montar()
    emitir(ASIGNADO)

    await userEvent.click(screen.getByRole('button', { name: 'Ver viaje' }))

    expect(acciones.marcarLeida).toHaveBeenCalledWith(12)
    expect(alAbrir).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Pantalla: viaje')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
