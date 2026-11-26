import type { AdministradorFila } from '../../types/administrador.types'

export type FiltroRol = 'todos' | 'MASTER' | 'ADMIN'

export function esFiltroRol(valor: unknown): valor is FiltroRol {
  return valor === 'todos' || valor === 'MASTER' || valor === 'ADMIN'
}

export interface FiltrosAdministradores {
  busqueda: string
  rol: FiltroRol
  // 'todas' o el id de la sucursal
  sucursal: string
}

// Mismo texto de hoy
export const rolTexto = (rol: string) => (rol === 'MASTER' ? 'General' : 'Sucursal')

// Las sucursales que aparecen en la lista, sin repetir y ordenadas por nombre (movido tal cual)
export function sucursalesDeLaLista(lista: AdministradorFila[]): { id: number; nombre: string }[] {
  return [
    ...new Map(lista.filter((a) => a.sucursal).map((a) => [a.sucursal!.id, a.sucursal!])).values(),
  ].sort((x, y) => x.nombre.localeCompare(y.nombre))
}

function coincideBusqueda(a: AdministradorFila, busqueda: string): boolean {
  const texto = busqueda.trim().toLowerCase()
  return a.nombre.toLowerCase().includes(texto) || a.email.toLowerCase().includes(texto)
}

const coincideRol = (a: AdministradorFila, rol: FiltroRol) => rol === 'todos' || a.rol === rol
const coincideSucursal = (a: AdministradorFila, sucursal: string) =>
  sucursal === 'todas' || String(a.sucursal?.id) === sucursal

// Misma lógica que tenía la página
export function filtrarAdministradores(lista: AdministradorFila[], f: FiltrosAdministradores): AdministradorFila[] {
  return lista.filter((a) => coincideBusqueda(a, f.busqueda) && coincideRol(a, f.rol) && coincideSucursal(a, f.sucursal))
}

// Contadores del menú de rol, sobre la búsqueda y la sucursal elegidas (D-AD1)
export function contarPorRol(lista: AdministradorFila[], f: Omit<FiltrosAdministradores, 'rol'>): Record<FiltroRol, number> {
  const conteo: Record<FiltroRol, number> = { todos: 0, MASTER: 0, ADMIN: 0 }
  for (const a of lista) {
    if (!coincideBusqueda(a, f.busqueda) || !coincideSucursal(a, f.sucursal)) continue
    conteo.todos += 1
    if (a.rol === 'MASTER' || a.rol === 'ADMIN') conteo[a.rol] += 1
  }
  return conteo
}

// Contadores del menú de sucursal ('todas' y cada id), sobre la búsqueda y el rol elegidos (D-AD1)
export function contarPorSucursal(lista: AdministradorFila[], f: Omit<FiltrosAdministradores, 'sucursal'>): Record<string, number> {
  const conteo: Record<string, number> = { todas: 0 }
  for (const a of lista) {
    if (!coincideBusqueda(a, f.busqueda) || !coincideRol(a, f.rol)) continue
    conteo.todas += 1
    if (a.sucursal) conteo[String(a.sucursal.id)] = (conteo[String(a.sucursal.id)] ?? 0) + 1
  }
  return conteo
}
