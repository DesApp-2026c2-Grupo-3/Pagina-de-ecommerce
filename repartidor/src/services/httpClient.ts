import { leerToken } from '../utils/sesion'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

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

type OyenteSesionExpirada = () => void

const oyentesSesionExpirada = new Set<OyenteSesionExpirada>()

// El AuthContext se suscribe para cerrar la sesión ante un 401
export function suscribirSesionExpirada(oyente: OyenteSesionExpirada): () => void {
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
      console.error('No se pudo cerrar la sesión expirada:', error)
    }
  }
}

// Habla con la API mandando el token por "Authorization: Bearer" (sin cookies).
// El mensaje del error es el `code` del backend si lo hay (lo usa el login), si no el `mensaje`.
export async function apiFetch<T>(endpoint: string, opciones: RequestInit = {}): Promise<T> {
  const headers = new Headers(opciones.headers)

  if (opciones.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = leerToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const respuesta = await fetch(`${API_URL}${endpoint}`, { ...opciones, headers })
  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    // Un 401 con token guardado es una sesión vencida o revocada (en el login no hay token)
    if (respuesta.status === 401 && token) notificarSesionExpirada()

    const codigo = typeof datos?.code === 'string' ? datos.code : undefined
    const mensaje = codigo ?? datos?.mensaje ?? 'Error al comunicarse con el servidor'

    throw new ErrorApi(mensaje, respuesta.status, codigo)
  }

  return datos as T
}
