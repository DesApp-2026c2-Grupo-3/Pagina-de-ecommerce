import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/productos`

export async function obtenerProductos() {
  return apiFetch(`${API}/`, {
    mensajePorDefecto: 'Error al obtener los productos',
  })
}

export async function obtenerProductoPorId(id: number) {
  return apiFetch(`${API}/${id}`, {
    mensajePorDefecto: 'Error al obtener el producto',
  })
}

export async function crearProducto(producto: unknown) {
  return apiFetch(`${API}/nuevo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
    mensajePorDefecto: 'Error al crear el producto',
  })
}

export async function actualizarProducto(id: number, producto: unknown) {
  return apiFetch(`${API}/editar/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(producto),
    mensajePorDefecto: 'Error al actualizar el producto',
  })
}

export async function eliminarProducto(id: number) {
  await apiFetch(`${API}/eliminar/${id}`, {
    method: 'DELETE',
    mensajePorDefecto: 'Error al eliminar el producto',
  })
}

// Para elegir los ingredientes de la receta
export async function obtenerInsumos() {
  return apiFetch(`${API_URL}/admin/insumos`, {
    mensajePorDefecto: 'Error al obtener los insumos',
  })
}

// Regular, mediano y grande, en orden
export async function obtenerTamanios() {
  return apiFetch(`${API_URL}/tamanios`, {
    mensajePorDefecto: 'Error al obtener los tamaños',
  })
}

// Por sucursal, cuántas unidades se pueden preparar con el stock actual
export async function verStockProducto(id: number) {
  return apiFetch(`${API}/${id}/stock`, {
    mensajePorDefecto: 'Error al obtener el stock del producto',
  })
}


export async function obtenerProductosEliminados() {
  return apiFetch(`${API}/eliminados`, {
    mensajePorDefecto: 'Error al obtener los productos eliminados',
  })
}

export async function restaurarProducto(id: number) {
  return apiFetch(`${API}/restaurar/${id}`, {
    method: 'PATCH',
    mensajePorDefecto: 'Error al restaurar el producto',
  })
}
