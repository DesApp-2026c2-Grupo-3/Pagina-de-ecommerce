import type {
  AccionNotificacionesCliente,
  EstadoNotificacionesCliente,
  EventoNotificacionLeida,
  NotificacionCliente,
} from '../../types/notificacion.types'

export const estadoInicial: EstadoNotificacionesCliente = {
  items: [],
  noLeidas: null,
  siguienteCursor: null,
  cargandoInicial: true,
  cargandoMas: false,
  marcandoTodas: false,
  errorCarga: null,
  errorAccion: null,
}

function tiempoDe(ocurridoEn: string): number {
  const tiempo = Date.parse(ocurridoEn)
  return Number.isNaN(tiempo) ? 0 : tiempo
}

function ordenar(items: NotificacionCliente[]): NotificacionCliente[] {
  return [...items].sort((a, b) => {
    const diferencia = tiempoDe(b.ocurridoEn) - tiempoDe(a.ocurridoEn)
    return diferencia !== 0 ? diferencia : b.id - a.id
  })
}

function fusionar(
  actuales: NotificacionCliente[],
  nuevos: NotificacionCliente[],
): NotificacionCliente[] {
  const mapa = new Map<number, NotificacionCliente>()

  for (const item of actuales) mapa.set(item.id, item)

  for (const item of nuevos) {
    const existente = mapa.get(item.id)

    if (!existente) {
      mapa.set(item.id, item)
      continue
    }

    mapa.set(item.id, {
      ...existente,
      leida: existente.leida || item.leida,
      leidaEn: existente.leidaEn ?? item.leidaEn,
    })
  }

  return ordenar([...mapa.values()])
}

function conLectura(
  item: NotificacionCliente,
  leida: boolean,
  leidaEn: string | null,
): NotificacionCliente {
  return { ...item, leida, leidaEn }
}

function aplicarLeida(
  items: NotificacionCliente[],
  id: number,
  leida: boolean,
  leidaEn: string | null,
): NotificacionCliente[] {
  return items.map((item) =>
    item.id === id ? conLectura(item, leida, leidaEn) : item,
  )
}

// Marca leídas las que ocurrieron hasta leidaEn (inclusive)
function marcarHasta(
  items: NotificacionCliente[],
  leidaEn: string,
): NotificacionCliente[] {
  const limite = tiempoDe(leidaEn)

  return items.map((item) => {
    if (item.leida || tiempoDe(item.ocurridoEn) > limite) return item
    return conLectura(item, true, leidaEn)
  })
}

function aplicarEventoLeida(
  estado: EstadoNotificacionesCliente,
  evento: EventoNotificacionLeida,
): EstadoNotificacionesCliente {
  if ('todas' in evento) {
    const items = marcarHasta(estado.items, evento.leidaEn)

    return {
      ...estado,
      items,
      noLeidas: items.filter((item) => !item.leida).length,
    }
  }

  const item = estado.items.find(
    (candidato) => candidato.id === evento.notificacionId,
  )
  if (!item) return estado

  const estabaNoLeida = !item.leida

  return {
    ...estado,
    items: aplicarLeida(
      estado.items,
      item.id,
      true,
      item.leidaEn ?? evento.leidaEn,
    ),
    noLeidas:
      estabaNoLeida && estado.noLeidas !== null
        ? Math.max(0, estado.noLeidas - 1)
        : estado.noLeidas,
  }
}

export function notificacionReducer(
  estado: EstadoNotificacionesCliente,
  accion: AccionNotificacionesCliente,
): EstadoNotificacionesCliente {
  switch (accion.type) {
    case 'REINICIAR':
      return { ...estadoInicial, cargandoInicial: false }

    case 'CARGA_INICIAL_INICIO':
      return {
        ...estado,
        cargandoInicial: true,
        errorCarga: null,
      }

    case 'CARGA_INICIAL_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        noLeidas: accion.noLeidas,
        siguienteCursor: accion.siguienteCursor,
        cargandoInicial: false,
        errorCarga: null,
      }

    case 'CARGA_INICIAL_ERROR':
      return {
        ...estado,
        cargandoInicial: false,
        errorCarga: { origen: 'inicial', mensaje: accion.mensaje },
      }

    case 'CARGA_MAS_INICIO':
      return {
        ...estado,
        cargandoMas: true,
        errorCarga: null,
      }

    case 'CARGA_MAS_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        siguienteCursor: accion.siguienteCursor,
        cargandoMas: false,
        errorCarga: null,
      }

    case 'CARGA_MAS_ERROR':
      return {
        ...estado,
        cargandoMas: false,
        errorCarga: { origen: 'mas', mensaje: accion.mensaje },
      }

    case 'CURSOR_DESCARTADO':
      return {
        ...estado,
        siguienteCursor: null,
        cargandoMas: false,
        errorCarga: null,
      }

    case 'NUEVA_NOTIFICACION': {
      const existente = estado.items.some(
        (item) => item.id === accion.notificacion.id,
      )

      return {
        ...estado,
        items: fusionar(estado.items, [accion.notificacion]),
        noLeidas:
          !existente && estado.noLeidas !== null
            ? estado.noLeidas + 1
            : estado.noLeidas,
      }
    }

    case 'LECTURA_LOCAL_OPTIMISTA': {
      const item = estado.items.find(
        (candidato) => candidato.id === accion.id,
      )
      if (!item || item.leida) return estado

      return {
        ...estado,
        errorAccion: null,
        items: aplicarLeida(estado.items, accion.id, true, accion.marca),
        noLeidas:
          estado.noLeidas === null
            ? null
            : Math.max(0, estado.noLeidas - 1),
      }
    }

    case 'LECTURA_LOCAL_REVERTIR': {
      const item = estado.items.find(
        (candidato) => candidato.id === accion.id,
      )
      // Solo se revierte la marca propia: si mientras tanto llegó la lectura del servidor, queda leída
      if (!item || !item.leida || item.leidaEn !== accion.marca) {
        return { ...estado, errorAccion: accion.mensaje }
      }

      return {
        ...estado,
        errorAccion: accion.mensaje,
        items: aplicarLeida(estado.items, accion.id, false, null),
        noLeidas:
          estado.noLeidas === null ? null : estado.noLeidas + 1,
      }
    }

    case 'LECTURA_REMOTA':
      return aplicarEventoLeida(estado, accion.evento)

    case 'MARCAR_TODAS_INICIO':
      return {
        ...estado,
        marcandoTodas: true,
        errorAccion: null,
      }

    // El corte es el leidaEn del servidor: lo que llegó después sigue sin leer (plan, E-3)
    case 'MARCAR_TODAS_OK': {
      const items = marcarHasta(estado.items, accion.leidaEn)

      return {
        ...estado,
        items,
        noLeidas: items.filter((item) => !item.leida).length,
        marcandoTodas: false,
      }
    }

    case 'MARCAR_TODAS_ERROR':
      return {
        ...estado,
        marcandoTodas: false,
        errorAccion: accion.mensaje,
      }
  }
}
