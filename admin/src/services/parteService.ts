import type { Parte, TipoParte } from '../types/notificacion.types'
import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/partes`
const JSON_HEADERS = { 'Content-Type': 'application/json' }

export interface DatosParte {
  tipo: TipoParte
  descripcion: string
  urgencia: 'NORMAL' | 'URGENTE'
  productoIds: number[]
  pedidoId: number | null
}

export async function obtenerPartes(estado?: 'pendientes' | 'resueltos') {
  return apiFetch<Parte[]>(estado ? `${API}?estado=${estado}` : API, { mensajePorDefecto: 'Error al obtener los partes' })
}

export async function crearParte(datos: DatosParte) {
  return apiFetch<{ id: number; avisados: number }>(API, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(datos),
    mensajePorDefecto: 'Error al enviar el parte',
  })
}

export async function resolverParte(id: number, nota: string) {
  return apiFetch<{ estado: string }>(`${API}/${id}/resolver`, {
    method: 'PATCH',
    headers: JSON_HEADERS,
    body: JSON.stringify({ nota }),
    mensajePorDefecto: 'Error al resolver el parte',
  })
}

// Catálogo público de la sucursal: el empleado elige de acá los productos afectados por un equipo roto
export async function obtenerCatalogoDeSucursal(sucursalId: number) {
  return apiFetch<{ id: number; nombre: string }[]>(`${API_URL}/productos?sucursalId=${sucursalId}`, {
    mensajePorDefecto: 'Error al obtener los productos',
  })
}
