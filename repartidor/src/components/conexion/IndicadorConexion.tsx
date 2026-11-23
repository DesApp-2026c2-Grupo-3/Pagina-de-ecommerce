import type { EstadoConexion } from '../../types/conexion.types'

interface IndicadorConexionProps {
  estado: EstadoConexion
}

const ESTILOS: Record<EstadoConexion, { texto: string; punto: string; pastilla: string; letra: string }> = {
  en_linea: { texto: 'En línea', punto: 'bg-green-600', pastilla: 'md:bg-emerald-50', letra: 'text-emerald-800' },
  conectando: { texto: 'Conectando…', punto: 'bg-amber-500 motion-safe:animate-pulse', pastilla: 'bg-amber-50', letra: 'text-amber-900' },
  reconectando: { texto: 'Reconectando…', punto: 'bg-amber-500 motion-safe:animate-pulse', pastilla: 'bg-amber-50', letra: 'text-amber-900' },
  sin_red: { texto: 'Sin conexión', punto: 'bg-red-600', pastilla: 'bg-red-50', letra: 'text-red-800' },
}

// Punto de color en el encabezado. En el celular, "En línea" queda solo para el lector de
// pantalla (el punto verde alcanza); los problemas se escriben siempre. No se anuncia solo:
// el que avisa es la franja, que aparece si el corte dura más de 3 s (evita avisos por microcortes).
export default function IndicadorConexion({ estado }: IndicadorConexionProps) {
  const estilo = ESTILOS[estado]
  const textoVisible = estado === 'en_linea' ? 'sr-only md:not-sr-only' : ''

  return (
    <div
      className={`flex min-h-8 items-center gap-2 rounded-full px-2.5 py-1 ${estilo.pastilla}`}
    >
      <span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${estilo.punto}`} />
      <span className={`text-sm font-semibold ${estilo.letra} ${textoVisible}`}>{estilo.texto}</span>
    </div>
  )
}
