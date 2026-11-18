import type { Notificacion } from './catalogo'
import type { EventoNotificacionLeida } from '../types/notificacion.types'
import { esRegistro, fechaIso, numeroPositivo } from './parseo'
import { esTipoNotificacion, obtenerEstrategia } from './registro'

// Payload del servidor → notificación de dominio. Un tipo desconocido o datos inválidos → null.
export function mapearNotificacion(valor: unknown): Notificacion | null {
  if (!esRegistro(valor) || !esTipoNotificacion(valor.tipo) || valor.version !== 1) return null

  const id = numeroPositivo(valor.id)
  const ocurridoEn = fechaIso(valor.ocurridoEn)
  if (id === null || ocurridoEn === null) return null

  const datos = obtenerEstrategia(valor.tipo).parsearDatos(valor.datos)
  if (datos === null) return null

  return {
    id,
    tipo: valor.tipo,
    version: 1,
    ocurridoEn,
    leida: valor.leida === true,
    leidaEn: fechaIso(valor.leidaEn),
    datos,
  } as Notificacion
}

export function mapearEventoLeida(valor: unknown): EventoNotificacionLeida | null {
  if (!esRegistro(valor)) return null

  const leidaEn = fechaIso(valor.leidaEn)
  if (leidaEn === null) return null

  if (valor.todas === true) return { todas: true, leidaEn }

  const notificacionId = numeroPositivo(valor.notificacionId)
  return notificacionId === null ? null : { notificacionId, leidaEn }
}

export function describirNotificacion(notificacion: Notificacion) {
  return obtenerEstrategia(notificacion.tipo).describir(notificacion as never)
}

export function destinoNotificacion(notificacion: Notificacion) {
  return obtenerEstrategia(notificacion.tipo).destino(notificacion as never)
}

// Cómo se anuncia si llega en vivo; null: solo va a la bandeja (plan UX, UX-07)
export function avisoEnVivo(notificacion: Notificacion) {
  const { aviso } = obtenerEstrategia(notificacion.tipo)
  if (!aviso) return null

  return { prioridad: aviso.prioridad, textoAccion: aviso.textoAccion(notificacion as never) }
}

// Ícono y color: lo que la bandeja y los toasts necesitan para dibujarlo
export function apariencia(notificacion: Notificacion) {
  const { icono, tono } = obtenerEstrategia(notificacion.tipo)
  return { icono, tono }
}
