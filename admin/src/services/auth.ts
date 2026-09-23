const API_URL = 'http://localhost:3000/admin'

export async function iniciarSesion(
  email: string,
  password: string
) {
  const respuesta = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!respuesta.ok) {
    throw new Error('Error al iniciar sesión')
  }

  return respuesta.json()
}