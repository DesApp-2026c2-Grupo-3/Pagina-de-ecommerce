import { notificarSesionExpirada } from '../utils/sesion'

export const API_URL = import.meta.env?.VITE_API_URL ?? 'http://localhost:3000'

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

export interface OpcionesApi extends RequestInit {
  // El login devuelve 401 con credenciales incorrectas: no debe expulsar la sesión.
  omitirExpiracion?: boolean
  mensajePorDefecto?: string
}

// Cliente HTTP único del panel: resuelve JSON, errores del backend y sesión vencida.
export async function apiFetch<T = any>(
  url: string,
  opciones: OpcionesApi = {},
): Promise<T> {
  const { omitirExpiracion = false, mensajePorDefecto, ...init } = opciones
  const respuesta = await fetch(url, { credentials: 'include', ...init })

  if (respuesta.status === 401 && !omitirExpiracion) {
    notificarSesionExpirada()
  }

  if (!respuesta.ok) {
    const datos = await respuesta.json().catch(() => ({}))
    throw new ErrorApi(
      datos?.code ??
        datos?.mensaje ??
        datos?.msj ??
        mensajePorDefecto ??
        'Error al procesar la solicitud',
      respuesta.status,
      datos?.code,
    )
  }

  const texto = await respuesta.text()
  return (texto ? JSON.parse(texto) : undefined) as T
}
