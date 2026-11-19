import type { TipoNotificacion } from './catalogo'
import type { EstrategiaNotificacion } from './tipos'

type ModuloEstrategia = {
  default: EstrategiaNotificacion<TipoNotificacion>
}

const modulos = import.meta.glob<ModuloEstrategia>('./estrategias/*.ts', {
  eager: true,
})

const ESTRATEGIAS = new Map<
  TipoNotificacion,
  EstrategiaNotificacion<TipoNotificacion>
>()

for (const modulo of Object.values(modulos)) {
  const estrategia = modulo.default

  if (ESTRATEGIAS.has(estrategia.tipo)) {
    throw new Error(`Estrategia de notificación duplicada: ${estrategia.tipo}`)
  }

  ESTRATEGIAS.set(estrategia.tipo, estrategia)
}

export function esTipoNotificacion(
  valor: unknown,
): valor is TipoNotificacion {
  return typeof valor === 'string' && ESTRATEGIAS.has(valor as TipoNotificacion)
}

export function obtenerEstrategia<T extends TipoNotificacion>(
  tipo: T,
): EstrategiaNotificacion<T> {
  const estrategia = ESTRATEGIAS.get(tipo)

  if (!estrategia) {
    throw new Error(`Tipo de notificación no registrado: ${tipo}`)
  }

  return estrategia as EstrategiaNotificacion<T>
}
