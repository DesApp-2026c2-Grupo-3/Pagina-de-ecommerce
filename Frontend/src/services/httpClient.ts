const BASE_URL = import.meta.env.VITE_API_URL

export async function httpClient<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null)
    throw new Error(errorBody?.mensaje || errorBody?.code || 'Error en la petición')
  }

  return response.json()
}