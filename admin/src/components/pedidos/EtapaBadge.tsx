import EstadoBadge from '../listas/EstadoBadge'
import { COLORES_ETAPA, normalizarEstado } from '../../utils/pedidoEstado'
import { ETAPAS } from '../../types/pedido.types'

// Etiqueta de la etapa del pedido con su color (sobre la etiqueta compartida)
export default function EtapaBadge({ estado, tamano = 'sm' }: { estado: string; tamano?: 'sm' | 'md' }) {
  const conocida = (ETAPAS as readonly string[]).includes(estado)
  const clases = conocida ? COLORES_ETAPA[normalizarEstado(estado)] : 'bg-gray-200 text-gray-700'
  return <EstadoBadge texto={estado} clases={clases} tamano={tamano} />
}
