import { leerToken } from '../utils/sesion'

export const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ErrorApi extends Error {
  status: number
  codigo?: string

  constructor(mensaje: string, status: number, codigo?: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.codigo = codigo
  }
}

export type OyenteSesionExpirada = () => void

const oyentesSesionExpirada = new Set<OyenteSesionExpirada>()

export function suscribirSesionExpirada(
  oyente: OyenteSesionExpirada,
): () => void {
  oyentesSesionExpirada.add(oyente)

  return () => {
    oyentesSesionExpirada.delete(oyente)
  }
}

function notificarSesionExpirada() {
  for (const oyente of [...oyentesSesionExpirada]) {
    try {
      oyente()
    } catch (error) {
      console.error('No se pudo limpiar la sesión expirada:', error)
    }
  }
}

export async function httpClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = leerToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401) notificarSesionExpirada()

    const errorBody = await response.json().catch(() => null)
    const code =
      typeof errorBody?.code === 'string' ? errorBody.code : undefined
    const mensaje =
      errorBody?.mensaje ||
      errorBody?.code ||
      'Error en la petición'

    throw new ErrorApi(mensaje, response.status, code)
  }

  return response.json()
}
