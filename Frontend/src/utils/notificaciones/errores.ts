import { ErrorApi } from '../../services/httpClient'

export function mensajeDeError(error: unknown, porDefecto: string): string {
  return error instanceof Error && error.message ? error.message : porDefecto
}

export function esCursorInvalido(error: unknown): boolean {
  return error instanceof ErrorApi && error.codigo === 'CURSOR_INVALIDO'
}

// Con la sesión vencida no se muestra error: el cierre de sesión ya lo resuelve
export function esSesionExpirada(error: unknown): boolean {
  return error instanceof ErrorApi && error.status === 401
}
