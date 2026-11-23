import { describe, expect, test } from 'vitest'
import { useEffect } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import { Bell } from 'lucide-react'

import ContenedorToasts from '../../../components/toasts/ContenedorToasts'
import Dialogo from '../../../components/ui/Dialogo'
import { ToastProvider } from '../../../context/toasts/ToastProvider'
import { useToast } from '../../../context/toasts/ToastContext'
import type { AccionesToasts } from '../../../types/toast.types'

// Entrega las acciones del proveedor al test, para disparar toasts desde afuera
function Espia({ alRecibir }: { alRecibir: (acciones: AccionesToasts) => void }) {
  const acciones = useToast()
  useEffect(() => alRecibir(acciones), [acciones, alRecibir])
  return null
}

function montar({ dialogoAbierto = false, conContenedor = true } = {}) {
  const ref: { acciones: AccionesToasts | null } = { acciones: null }
  const recibir = (acciones: AccionesToasts) => {
    ref.acciones = acciones
  }

  const dibujar = (abierto: boolean, contenedor: boolean) => (
    <ToastProvider>
      <Espia alRecibir={recibir} />
      <Dialogo abierto={abierto} titulo="Avisos" onCerrar={() => {}}>
        <p>Contenido</p>
      </Dialogo>
      {contenedor && <ContenedorToasts />}
    </ToastProvider>
  )

  const resultado = render(dibujar(dialogoAbierto, conContenedor))
  const mostrar = (id: string) =>
    act(() => ref.acciones?.mostrar({ id, tono: 'marca', icono: Bell, titulo: `Aviso ${id}`, prioridad: 'alta' }))
  const redibujar = (abierto: boolean, contenedor = true) => resultado.rerender(dibujar(abierto, contenedor))

  return { mostrar, redibujar }
}

describe('ContenedorToasts', () => {
  test('sin toasts no dibuja nada', () => {
    montar()

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })

  test('con toasts: región "Avisos en vivo" abierta en la capa superior (popover manual)', () => {
    const { mostrar } = montar()
    mostrar('a')

    const region = screen.getByRole('region', { name: 'Avisos en vivo' })
    expect(region).toHaveAttribute('popover', 'manual')
    expect(within(region).getByRole('alert')).toHaveTextContent('Aviso a')
  })

  test('muestra hasta 3, el más nuevo arriba; el cuarto espera', () => {
    const { mostrar } = montar()
    for (const id of ['a', 'b', 'c', 'd']) mostrar(id)

    expect(screen.getAllByRole('alert').map((alerta) => alerta.textContent)).toEqual(['Aviso c', 'Aviso b', 'Aviso a'])
  })

  test('con un diálogo modal abierto, los toasts se dibujan adentro (afuera todo queda inerte)', () => {
    const { mostrar, redibujar } = montar({ dialogoAbierto: true })
    mostrar('a')

    const dialogo = screen.getByRole('dialog', { name: 'Avisos' })
    expect(within(dialogo).getByRole('region', { name: 'Avisos en vivo' })).toBeInTheDocument()

    // Al cerrarse el diálogo vuelven al documento
    redibujar(false)
    const region = screen.getByRole('region', { name: 'Avisos en vivo' })
    expect(region.closest('dialog')).toBeNull()
    expect(within(region).getByRole('alert')).toHaveTextContent('Aviso a')
  })

  test('al desmontarse (fin de la sesión) descarta lo pendiente', () => {
    const { mostrar, redibujar } = montar()
    mostrar('a')

    redibujar(false, false)
    redibujar(false, true)

    expect(screen.queryByRole('region', { name: 'Avisos en vivo' })).not.toBeInTheDocument()
  })
})
