const API_URL = 'http://localhost:3000'

export async function obtenerAdministradores() {
  const respuesta = await fetch(`${API_URL}/administradores`)

  if (!respuesta.ok) {
    throw new Error('Error al obtener los administradores')
  }

  return respuesta.json()
}

export async function crearAdministrador(administrador: unknown) {
  const respuesta = await fetch(`${API_URL}/administradores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(administrador),
  })

  if (!respuesta.ok) {
    throw new Error('Error al crear el administrador')
  }

  return respuesta.json()
}

export async function actualizarAdministrador(id: number,  administrador: unknown) {
  const respuesta = await fetch(
    `${API_URL}/administradores/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(administrador),
    }
  )

  if (!respuesta.ok) {
    throw new Error('Error al actualizar el administrador')
  }

  return respuesta.json()
}

export async function eliminarAdministrador(id: number) {
  const respuesta = await fetch(
    `${API_URL}/administradores/${id}`,
    {
      method: 'DELETE',
    }
  )

  if (!respuesta.ok) {
    throw new Error('Error al eliminar el administrador')
  }
}