const API_URL = 'http://localhost:3000'

export async function obtenerCategorias() {
  const respuesta = await fetch(`${API_URL}/categorias`)

  if (!respuesta.ok) {
    throw new Error('Error al obtener las categorías')
  }

  return respuesta.json()
}

export async function crearCategoria(categoria: unknown) {
  const respuesta = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoria),
  })

  if (!respuesta.ok) {
    throw new Error('Error al crear la categoría')
  }

  return respuesta.json()
}

export async function actualizarCategoria(id: number,  categoria: unknown) {
  const respuesta = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoria),
  })

  if (!respuesta.ok) {
    throw new Error('Error al actualizar la categoría')
  }

  return respuesta.json()
}

export async function eliminarCategoria(id: number) {
  const respuesta = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'DELETE',
  })

  if (!respuesta.ok) {
    throw new Error('Error al eliminar la categoría')
  }
}