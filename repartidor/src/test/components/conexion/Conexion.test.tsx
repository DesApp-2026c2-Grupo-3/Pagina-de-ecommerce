import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'

import IndicadorConexion from '../../../components/conexion/IndicadorConexion'
import FranjaConexion from '../../../components/conexion/FranjaConexion'

describe('IndicadorConexion', () => {
  test('en línea: el texto existe para el lector de pantalla (en el celular solo se ve el punto)', () => {
    render(<IndicadorConexion estado="en_linea" />)

    expect(screen.getByText('En línea')).toHaveClass('sr-only', 'md:not-sr-only')
  })

  test.each([
    ['conectando', 'Conectando…'],
    ['reconectando', 'Reconectando…'],
    ['sin_red', 'Sin conexión'],
  ] as const)('%s: el texto se ve siempre', (estado, texto) => {
    render(<IndicadorConexion estado={estado} />)

    expect(screen.getByText(texto)).not.toHaveClass('sr-only')
  })

  test('no se anuncia solo (lo hace la franja, para no avisar microcortes)', () => {
    render(<IndicadorConexion estado="reconectando" />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('FranjaConexion', () => {
  test('oculta no dibuja nada', () => {
    const { container } = render(<FranjaConexion franja="oculta" />)

    expect(container).toBeEmptyDOMElement()
  })

  test.each([
    ['reconectando', 'Sin conexión en tiempo real.'],
    ['sin_red', 'Estás sin internet.'],
    ['volvio', 'Conectado de nuevo.'],
  ] as const)('%s: se anuncia con su mensaje', (franja, texto) => {
    render(<FranjaConexion franja={franja} />)

    expect(screen.getByRole('status')).toHaveTextContent(texto)
  })
})
