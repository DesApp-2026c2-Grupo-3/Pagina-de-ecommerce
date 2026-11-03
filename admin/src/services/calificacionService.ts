import { apiFetch, API_URL } from './httpClient'
import type {
  FiltrosCalificaciones,
  ListadoCalificaciones,
  OpcionesFiltros,
  ResumenCalificaciones,
} from '../types/calificacion.types'

const API = `${API_URL}/admin/calificaciones`

// Solo manda los filtros que tienen valor
function armarQuery(filtros: FiltrosCalificaciones, extra: Record<string, string | number> = {}) {
  const params = new URLSearchParams()
  for (const [clave, valor] of Object.entries({ ...filtros, ...extra })) {
    if (valor === undefined || valor === '' || valor === false) continue
    params.set(clave, String(valor))
  }
  const texto = params.toString()
  return texto ? `?${texto}` : ''
}

// El master ve todas las sucursales; el admin de sucursal, solo la suya (lo decide el backend)

export async function obtenerOpcionesFiltros() {
  return apiFetch<OpcionesFiltros>(`${API}/filtros`, {
    mensajePorDefecto: 'Error al obtener los filtros',
  })
}

export async function obtenerResumenCalificaciones(filtros: FiltrosCalificaciones) {
  return apiFetch<ResumenCalificaciones>(`${API}/resumen${armarQuery(filtros)}`, {
    mensajePorDefecto: 'Error al obtener el resumen de calificaciones',
  })
}

export async function obtenerCalificaciones(filtros: FiltrosCalificaciones, pagina: number, limite: number) {
  return apiFetch<ListadoCalificaciones>(`${API}${armarQuery(filtros, { pagina, limite })}`, {
    mensajePorDefecto: 'Error al obtener las calificaciones',
  })
}
