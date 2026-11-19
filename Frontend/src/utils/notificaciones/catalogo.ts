import type { EstrategiaNotificacionCliente } from '../../types/notificacion.types'
import { estrategiaPedidoCreado } from './estrategias/pedidoCreado'
import { estrategiaPedidoEstadoCambiado } from './estrategias/pedidoEstadoCambiado'
import { estrategiaSucursalCerrada } from './estrategias/sucursalCerrada'

// Única lista de los avisos que entiende el cliente: un tipo nuevo es un archivo en
// estrategias/ y una línea acá. Lo que no está en el catálogo se descarta (plan, C-3).
export const CATALOGO_NOTIFICACIONES: readonly EstrategiaNotificacionCliente[] = [
  estrategiaPedidoCreado,
  estrategiaPedidoEstadoCambiado,
  estrategiaSucursalCerrada,
]
