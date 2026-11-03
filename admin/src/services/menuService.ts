import { apiFetch, API_URL } from './httpClient'
import type { MenuAdmin } from '../types/menu.types'

const API = `${API_URL}/admin/menu`

// Solo el Admin-Master arma el menú del catálogo: el backend rechaza a cualquier otro rol

export async function obtenerMenu() {
  return apiFetch<MenuAdmin>(API, {
    mensajePorDefecto: 'Error al obtener el menú',
  })
}

// Se guarda el menú completo: el orden de las listas es el orden en el catálogo
export async function guardarMenu(menu: MenuAdmin) {
  return apiFetch<MenuAdmin & { mensaje: string }>(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(menu),
    mensajePorDefecto: 'Error al guardar el menú',
  })
}
