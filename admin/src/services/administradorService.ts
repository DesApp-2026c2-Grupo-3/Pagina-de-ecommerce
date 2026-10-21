import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin`

export async function obtenerAdministradores() {
  return apiFetch(`${API}/administradores`, {
    mensajePorDefecto: 'Error al obtener los administradores',
  })
}

export async function obtenerAdministradorPorId(id: number) {
  return apiFetch(`${API}/${id}`, {
    mensajePorDefecto: 'Error al obtener el administrador',
  })
}

export async function crearAdministrador(administrador: unknown) {
  return apiFetch(`${API}/administradores/nuevo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(administrador),
    mensajePorDefecto: 'Error al crear el administrador',
  })
}

export async function actualizarAdministrador(
  id: number,
  administrador: unknown,
) {
  return apiFetch(`${API}/administradores/editar/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(administrador),
    mensajePorDefecto: 'Error al actualizar el administrador',
  })
}

export async function eliminarAdministrador(id: number) {
  await apiFetch(`${API}/eliminar/${id}`, {
    method: 'DELETE',
    mensajePorDefecto: 'Error al eliminar el administrador',
  })
}
