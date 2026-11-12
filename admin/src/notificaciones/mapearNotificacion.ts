import type {
  EventoNotificacionLeida,
  Notificacion,
} from '../types/notificacion.types'
import { esRegistro, fechaIso, numeroPositivo } from './parseo'
import { esTipoNotificacion, obtenerEstrategia } from './registro'

function base(valor: unknown) {
  if (!esRegistro(valor) || !esTipoNotificacion(valor.tipo)) return null

  const id = numeroPositivo(valor.id)
  const ocurridoEn = fechaIso(valor.ocurridoEn)
  if (id === null || ocurridoEn === null || valor.version !== 1) return null

  return {
    id,
    tipo: valor.tipo,
    version: 1,
    ocurridoEn,
    leida: valor.leida === true,
    leidaEn: fechaIso(valor.leidaEn),
  }
}

export function mapearNotificacion(valor: unknown): Notificacion | null {
  const comun = base(valor)
  if (!comun || !esRegistro(valor)) return null

  const estrategia = obtenerEstrategia(comun.tipo)
  const datos = estrategia.parsearDatos(valor.datos)
  if (datos === null) return null

  return { ...comun, tipo: comun.tipo, datos } as Notificacion
}

export function mapearEventoLeida(valor: unknown): EventoNotificacionLeida | null {
  if (!esRegistro(valor)) return null

  const leidaEn = fechaIso(valor.leidaEn)
  if (leidaEn === null) return null

  if (valor.todas === true) {
    return { todas: true, leidaEn }
  }

  const notificacionId = numeroPositivo(valor.notificacionId)
  if (notificacionId === null) return null

  return { notificacionId, leidaEn }
}
