const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function apiFetch<T>(
  endpoint: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch(`${API_URL}${endpoint}`, {
    ...opciones,
    credentials: 'include',
  })

  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok) {
    throw new Error(
      datos?.code ?? datos?.mensaje ?? 'Error al comunicarse con el servidor',
    )
  }

  return datos as T
}