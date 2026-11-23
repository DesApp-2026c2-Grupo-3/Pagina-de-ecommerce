import type {
  BaseNotificacion,
  DescripcionNotificacionCliente,
  EstrategiaNotificacionCliente,
  NotificacionCliente,
} from '../../types/notificacion.types'
import { CATALOGO_NOTIFICACIONES } from './catalogo'
import { esRegistro, fechaIso, numeroPositivo } from './validaciones'

interface Sobre {
  tipo: string
  base: BaseNotificacion
  datos: unknown
}

// Lo común a todos los avisos; los datos propios los valida la estrategia de cada tipo
function leerSobre(payload: unknown): Sobre | null {
  if (!esRegistro(payload)) return null

  const id = numeroPositivo(payload.id)
  const ocurridoEn = fechaIso(payload.ocurridoEn)
  if (id === null || typeof payload.tipo !== 'string' || !ocurridoEn) return null
  if (payload.version !== 1) return null

  let leidaEn: string | null = null
  if (payload.leidaEn != null) {
    leidaEn = fechaIso(payload.leidaEn)
    if (!leidaEn) return null
  }

  return {
    tipo: payload.tipo,
    datos: payload.datos,
    base: {
      id,
      version: 1,
      ocurridoEn,
      leida: payload.leida === true,
      leidaEn,
    },
  }
}

// Registro de estrategias: crea, describe y resuelve el destino de cada aviso según su tipo
export class FabricaNotificacionesCliente {
  private readonly estrategias = new Map<string, EstrategiaNotificacionCliente>()

  constructor(catalogo: readonly EstrategiaNotificacionCliente[]) {
    for (const estrategia of catalogo) this.estrategias.set(estrategia.tipo, estrategia)
  }

  crear(payload: unknown): NotificacionCliente | null {
    const sobre = leerSobre(payload)
    if (!sobre) return null

    return this.estrategias.get(sobre.tipo)?.crear(sobre.base, sobre.datos) ?? null
  }

  // Toda notificación ya creada tiene su estrategia en el registro
  describir(notificacion: NotificacionCliente): DescripcionNotificacionCliente {
    return this.estrategias.get(notificacion.tipo)!.describir(notificacion)
  }

  obtenerDestino(notificacion: NotificacionCliente): string | null {
    return this.estrategias.get(notificacion.tipo)!.obtenerDestino(notificacion)
  }
}

export const fabricaNotificacionesCliente = new FabricaNotificacionesCliente(
  CATALOGO_NOTIFICACIONES,
)
