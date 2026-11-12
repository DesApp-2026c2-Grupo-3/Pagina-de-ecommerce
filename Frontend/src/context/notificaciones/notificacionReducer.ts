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
  error: null,
  hayMas: false,
  noLeidasAlMarcarTodas: null,
  marcaMarcarTodas: null,
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

function marcarHasta(
  items: NotificacionCliente[],
  leidaEn: string,
  hasta: string,
): NotificacionCliente[] {
  const limite = tiempoDe(hasta)

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
    const items = marcarHasta(estado.items, evento.leidaEn, evento.leidaEn)

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
        error: null,
      }

    case 'CARGA_INICIAL_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        noLeidas: accion.noLeidas,
        siguienteCursor: accion.siguienteCursor,
        cargandoInicial: false,
        error: null,
        hayMas: accion.siguienteCursor !== null,
      }

    case 'CARGA_INICIAL_ERROR':
      return {
        ...estado,
        cargandoInicial: false,
        error: accion.mensaje,
      }

    case 'CARGA_MAS_INICIO':
      return {
        ...estado,
        cargandoMas: true,
        error: null,
      }

    case 'CARGA_MAS_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        siguienteCursor: accion.siguienteCursor,
        cargandoMas: false,
        error: null,
        hayMas: accion.siguienteCursor !== null,
      }

    case 'CARGA_MAS_ERROR':
      return {
        ...estado,
        cargandoMas: false,
        error: accion.mensaje,
      }

    case 'CURSOR_DESCARTADO':
      return {
        ...estado,
        siguienteCursor: null,
        hayMas: false,
        cargandoMas: false,
        error: null,
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
      if (!item || !item.leida || item.leidaEn !== accion.marca) return estado

      return {
        ...estado,
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
        error: null,
        noLeidasAlMarcarTodas: estado.noLeidas,
        marcaMarcarTodas: accion.marca,
      }

    case 'MARCAR_TODAS_OK': {
      const hasta = estado.marcaMarcarTodas ?? accion.leidaEn
      const items = marcarHasta(estado.items, accion.leidaEn, hasta)

      return {
        ...estado,
        items,
        noLeidas: items.filter((item) => !item.leida).length,
        marcandoTodas: false,
        error: null,
        noLeidasAlMarcarTodas: null,
        marcaMarcarTodas: null,
      }
    }

    case 'MARCAR_TODAS_ERROR':
      return {
        ...estado,
        marcandoTodas: false,
        error: accion.mensaje,
        noLeidasAlMarcarTodas: null,
        marcaMarcarTodas: null,
      }

    case 'CONTADOR_ACTUALIZADO':
      return {
        ...estado,
        noLeidas: accion.noLeidas,
      }

    case 'ERROR_ACTUALIZADO':
      return {
        ...estado,
        error: accion.mensaje,
      }
  }
}
