const API_URL = 'http://localhost:3000'

export async function obtenerProductos() {
  const respuesta = await fetch(`${API_URL}/productos`)

  if (!respuesta.ok) {
    throw new Error('Error al obtener los productos')
  }

  return respuesta.json()
}

export async function crearProducto(producto: unknown) {
  const respuesta = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(producto),
  })

  if (!respuesta.ok) {
    throw new Error('Error al crear el producto')
  }

  return respuesta.json()
}

export async function actualizarProducto(id: number,producto: unknown) {
  const respuesta = await fetch(`${API_URL}/productos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(producto),
  })

  if (!respuesta.ok) {
    throw new Error('Error al actualizar el producto')
  }

  return respuesta.json()
}

export async function eliminarProducto(id: number) {
  const respuesta = await fetch(`${API_URL}/productos/${id}`, {
    method: 'DELETE',
  })

  if (!respuesta.ok) {
    throw new Error('Error al eliminar el producto')
  }
}