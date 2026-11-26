import type { RegistroTiempoPedido } from '../../types/pedido.types'
import {
  PASOS_SEGUIMIENTO,
  fechaCancelacion,
  fechasPorPaso,
  normalizarEstado,
} from '../pedidoEstado'

// Recorrido del bloque de seguimiento (plan responsivo, 4.4.1):
// cumplido (tilde verde), actual (color de la etapa), pendiente (gris, con quién lo marca)
// y, solo para pedidos cancelados, un paso final rojo.
export type TipoPaso = 'hecho' | 'actual' | 'pendiente' | 'cancelado'

export interface PasoRecorrido {
  estado: string
  tipo: TipoPaso
  fecha: string | null
  quien: string | null
}

const QUIEN_LO_MARCA: Record<string, string> = {
  'En proceso': 'Lo marca la sucursal',
  'Listo para retirar': 'Lo marca la sucursal',
  'En camino': 'Lo marca el repartidor al salir',
  Entregado: 'Lo marca el repartidor al entregar',
}

// Desde qué etapa se canceló: el estadoAnterior del último registro de cancelación
export function etapaAntesDeCancelar(historial: RegistroTiempoPedido[]): string {
  const cancelaciones = (historial ?? []).filter(
    (registro) => normalizarEstado(registro.estado) === 'Cancelado',
  )
  const ultima = cancelaciones[cancelaciones.length - 1]
  if (ultima?.estadoAnterior) return normalizarEstado(ultima.estadoAnterior)

  // Sin estadoAnterior: el último paso del flujo que figure en el historial
  const pasos = (historial ?? [])
    .map((registro) => normalizarEstado(registro.estado))
    .filter((estado) => estado !== 'Cancelado')
  return pasos[pasos.length - 1] ?? 'Pendiente'
}

export function armarRecorrido(
  estado: string,
  historial: RegistroTiempoPedido[],
): PasoRecorrido[] {
  const actual = normalizarEstado(estado)
  const fechas = fechasPorPaso(historial)
  const paso = (nombre: string, tipo: TipoPaso): PasoRecorrido => ({
    estado: nombre,
    tipo,
    fecha: tipo === 'pendiente' ? null : (fechas.get(nombre) ?? null),
    quien: tipo === 'pendiente' ? (QUIEN_LO_MARCA[nombre] ?? null) : null,
  })

  if (actual === 'Cancelado') {
    const desde = etapaAntesDeCancelar(historial)
    const tope = Math.max(0, (PASOS_SEGUIMIENTO as readonly string[]).indexOf(desde))
    const cumplidos = PASOS_SEGUIMIENTO.slice(0, tope + 1).map((nombre) => paso(nombre, 'hecho'))
    return [
      ...cumplidos,
      { estado: 'Cancelado', tipo: 'cancelado', fecha: fechaCancelacion(historial), quien: null },
    ]
  }

  const indice = (PASOS_SEGUIMIENTO as readonly string[]).indexOf(actual)
  return PASOS_SEGUIMIENTO.map((nombre, i) => {
    if (actual === 'Entregado' || i < indice) return paso(nombre, 'hecho')
    if (i === indice) return paso(nombre, 'actual')
    return paso(nombre, 'pendiente')
  })
}
