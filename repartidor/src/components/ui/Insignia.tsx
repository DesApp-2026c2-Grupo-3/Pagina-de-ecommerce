import { useEffect, useRef, useState } from 'react'

interface InsigniaProps {
  // null: todavía no se sabe (no se muestra)
  cantidad: number | null
  // Se ubica en la esquina de su contenedor (por ejemplo, sobre la campana)
  flotante?: boolean
  // alerta (rojo): avisos sin leer. marca (naranja): algo disponible, sin urgencia
  tono?: 'alerta' | 'marca'
}

const FONDOS = { alerta: 'bg-red-600', marca: 'bg-orange-700' } as const

const MAXIMO_INSIGNIA = 99

function textoInsignia(cantidad: number): string {
  return cantidad > MAXIMO_INSIGNIA ? `${MAXIMO_INSIGNIA}+` : String(cantidad)
}

// Contador numérico. Es decorativo (aria-hidden): quien la usa pone el número en su etiqueta
export default function Insignia({ cantidad, flotante = false, tono = 'alerta' }: InsigniaProps) {
  const anterior = useRef(cantidad ?? 0)
  const [saltos, setSaltos] = useState(0)

  // Solo salta cuando el número sube, no al aparecer ni al bajar
  useEffect(() => {
    const actual = cantidad ?? 0
    if (actual > anterior.current) setSaltos((previos) => previos + 1)
    anterior.current = actual
  }, [cantidad])

  if (cantidad === null || cantidad <= 0) return null

  return (
    <span
      key={saltos}
      aria-hidden="true"
      data-testid="insignia"
      className={
        `inline-flex h-5 min-w-5 items-center justify-center rounded-full ${FONDOS[tono]} px-1.5 ` +
        'text-[11px] font-bold leading-none text-white tabular-nums ring-2 ring-white' +
        (flotante ? ' absolute -right-1.5 -top-1.5' : '') +
        (saltos > 0 ? ' motion-safe:animate-insignia' : '')
      }
    >
      {textoInsignia(cantidad)}
    </span>
  )
}
