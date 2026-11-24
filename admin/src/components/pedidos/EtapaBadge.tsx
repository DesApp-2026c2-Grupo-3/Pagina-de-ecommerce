import { COLORES_ETAPA, normalizarEstado } from '../../utils/pedidoEstado'
import { ETAPAS } from '../../types/pedido.types'

// Etiqueta de la etapa con su color (siempre con texto: el color no es el único indicio)
export default function EtapaBadge({
  estado,
  tamano = 'sm',
}: {
  estado: string
  tamano?: 'sm' | 'md'
}) {
  const conocida = (ETAPAS as readonly string[]).includes(estado)
  const color = conocida
    ? COLORES_ETAPA[normalizarEstado(estado)]
    : 'bg-gray-200 text-gray-700'
  const medida = tamano === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md font-semibold ${medida} ${color}`}
    >
      {estado}
    </span>
  )
}
