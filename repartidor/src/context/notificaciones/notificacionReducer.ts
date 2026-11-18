import type {
  AccionNotificaciones,
  EstadoNotificaciones,
  EventoNotificacionLeida,
} from '../../types/notificacion.types'
import type { Notificacion } from '../../notificaciones/catalogo'

export const estadoInicial: EstadoNotificaciones = {
  items: [],
  noLeidas: null,
  siguienteCursor: null,
  cargandoInicial: true,
  cargandoMas: false,
  error: null,
  errorCargaMas: null,
  marcandoTodas: false,
  respaldoMarcarTodas: null,
}

function ordenar(items: Notificacion[]): Notificacion[] {
  return [...items].sort((a, b) => {
    const diferencia = Date.parse(b.ocurridoEn) - Date.parse(a.ocurridoEn)
    return diferencia !== 0 ? diferencia : b.id - a.id
  })
}

// Deduplica por id. Una lectura nunca se pierde: si una copia ya está leída, queda leída.
function fusionar(actuales: Notificacion[], nuevas: Notificacion[]): Notificacion[] {
  const porId = new Map<number, Notificacion>()

  for (const item of actuales) porId.set(item.id, item)

  for (const item of nuevas) {
    const existente = porId.get(item.id)
    if (!existente) {
      porId.set(item.id, item)
    } else if (!existente.leida && item.leida) {
      porId.set(item.id, { ...existente, leida: true, leidaEn: item.leidaEn })
    }
  }

  return ordenar([...porId.values()])
}

function marcarUna(estado: EstadoNotificaciones, id: number, leidaEn: string): EstadoNotificaciones {
  const item = estado.items.find((candidato) => candidato.id === id)
  if (!item || item.leida) return estado

  return {
    ...estado,
    items: estado.items.map((candidato) =>
      candidato.id === id ? { ...candidato, leida: true, leidaEn } : candidato,
    ),
    noLeidas: estado.noLeidas === null ? null : Math.max(0, estado.noLeidas - 1),
  }
}

// "Leer todas" alcanza a las que ocurrieron hasta ese momento, no a las que llegaron después
function marcarHasta(estado: EstadoNotificaciones, leidaEn: string): EstadoNotificaciones {
  const limite = Date.parse(leidaEn)
  const items = estado.items.map((item) =>
    item.leida || Date.parse(item.ocurridoEn) > limite ? item : { ...item, leida: true, leidaEn },
  )

  return { ...estado, items, noLeidas: items.filter((item) => !item.leida).length }
}

// Deshace una lectura optimista, solo si sigue siendo la que se marcó localmente
function revertirUna(estado: EstadoNotificaciones, id: number, marca: string): EstadoNotificaciones {
  const item = estado.items.find((candidato) => candidato.id === id)
  if (!item || item.leidaEn !== marca) return estado

  return {
    ...estado,
    items: estado.items.map((candidato) =>
      candidato.id === id ? { ...candidato, leida: false, leidaEn: null } : candidato,
    ),
    noLeidas: estado.noLeidas === null ? null : estado.noLeidas + 1,
  }
}

function revertirTodas(estado: EstadoNotificaciones): EstadoNotificaciones {
  const respaldo = estado.respaldoMarcarTodas
  if (!respaldo) return { ...estado, marcandoTodas: false }

  return {
    ...estado,
    items: estado.items.map((item) =>
      item.leidaEn === respaldo.marca ? { ...item, leida: false, leidaEn: null } : item,
    ),
    noLeidas: respaldo.noLeidas,
    marcandoTodas: false,
    respaldoMarcarTodas: null,
  }
}

function aplicarLectura(estado: EstadoNotificaciones, evento: EventoNotificacionLeida) {
  return 'todas' in evento
    ? marcarHasta(estado, evento.leidaEn)
    : marcarUna(estado, evento.notificacionId, evento.leidaEn)
}

export function notificacionReducer(
  estado: EstadoNotificaciones,
  accion: AccionNotificaciones,
): EstadoNotificaciones {
  switch (accion.type) {
    case 'CARGA_INICIAL_INICIO':
      return { ...estado, cargandoInicial: true, error: null }

    case 'CARGA_INICIAL_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        noLeidas: accion.noLeidas,
        siguienteCursor: accion.siguienteCursor,
        cargandoInicial: false,
        error: null,
      }

    case 'CARGA_INICIAL_ERROR':
      return { ...estado, cargandoInicial: false, error: accion.mensaje }

    case 'CARGA_MAS_INICIO':
      return { ...estado, cargandoMas: true, errorCargaMas: null }

    case 'CARGA_MAS_OK':
      return {
        ...estado,
        items: fusionar(estado.items, accion.items),
        siguienteCursor: accion.siguienteCursor,
        cargandoMas: false,
      }

    case 'CARGA_MAS_ERROR':
      return { ...estado, cargandoMas: false, errorCargaMas: accion.mensaje }

    case 'NUEVA_NOTIFICACION': {
      const yaEstaba = estado.items.some((item) => item.id === accion.notificacion.id)
      return {
        ...estado,
        items: fusionar(estado.items, [accion.notificacion]),
        noLeidas: !yaEstaba && !accion.notificacion.leida && estado.noLeidas !== null
          ? estado.noLeidas + 1
          : estado.noLeidas,
      }
    }

    case 'LECTURA_OPTIMISTA':
      return marcarUna(estado, accion.id, accion.marca)

    case 'LECTURA_REVERTIR':
      return revertirUna(estado, accion.id, accion.marca)

    case 'MARCAR_TODAS_INICIO':
      return {
        ...marcarHasta(estado, accion.marca),
        marcandoTodas: true,
        respaldoMarcarTodas: { marca: accion.marca, noLeidas: estado.noLeidas },
      }

    case 'MARCAR_TODAS_OK':
      return {
        ...marcarHasta(estado, accion.leidaEn),
        marcandoTodas: false,
        respaldoMarcarTodas: null,
      }

    case 'MARCAR_TODAS_ERROR':
      return revertirTodas(estado)

    case 'LECTURA_REMOTA':
      return aplicarLectura(estado, accion.evento)

    case 'CONTADOR_ACTUALIZADO':
      return { ...estado, noLeidas: accion.noLeidas }

    case 'REINICIAR':
      return estadoInicial
  }
}
