import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/categorias`

export async function obtenerCategorias() {
  return apiFetch(API, {
    mensajePorDefecto: 'Error al obtener las categorías',
  })
}

export async function crearCategoria(categoria: unknown) {
  return apiFetch(`${API}/nueva`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoria),
    mensajePorDefecto: 'Error al crear la categoría',
  })
}

export async function actualizarCategoria(id: number, categoria: unknown) {
  return apiFetch(`${API}/editar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoria),
    mensajePorDefecto: 'Error al actualizar la categoría',
  })
}

export async function eliminarCategoria(id: number) {
  await apiFetch(`${API}/eliminar/${id}`, {
    method: 'DELETE',
    mensajePorDefecto: 'Error al eliminar la categoría',
  })
}
