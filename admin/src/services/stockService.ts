import { apiFetch, API_URL } from './httpClient'
import { leerSesion } from '../utils/sesion'

const API = `${API_URL}/admin/stock`

export const MOTIVOS_BAJA = [
  { valor: 'merma', etiqueta: 'Merma (se echó a perder)' },
  { valor: 'vencimiento', etiqueta: 'Vencimiento' },
  { valor: 'rotura', etiqueta: 'Rotura' },
  { valor: 'faltante', etiqueta: 'Faltante' },
  { valor: 'correccion', etiqueta: 'Corrección de carga' },
  { valor: 'otro', etiqueta: 'Otro' },
] as const

const patch = (body: unknown): RequestInit => ({
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

// Quién está logueado: queda registrado en el historial de movimientos
function adminIdSesion(): number | undefined {
  return leerSesion()?.id ?? undefined
}

export function obtenerStockPorSucursal(sucursalId: number) {
  return apiFetch(`${API}/sucursal/${sucursalId}`, {
    mensajePorDefecto: 'Error al obtener el stock',
  })
}

export function obtenerMovimientos(sucursalId: number) {
  return apiFetch(`${API}/sucursal/${sucursalId}/movimientos`, {
    mensajePorDefecto: 'Error al obtener los movimientos',
  })
}

export function cargarAumento(id: number, cantidad: number) {
  return apiFetch(`${API}/${id}/aumentar`, {
    ...patch({ cantidad, adminId: adminIdSesion() }),
    mensajePorDefecto: 'Error al cargar stock',
  })
}

export function registrarBaja(
  id: number,
  datos: { cantidad: number; motivo: string; detalle: string },
) {
  return apiFetch(`${API}/${id}/bajar`, {
    ...patch({ ...datos, adminId: adminIdSesion() }),
    mensajePorDefecto: 'Error al registrar la baja',
  })
}

// null = sin alerta
export function definirMinimo(id: number, stockMinimo: number | null) {
  return apiFetch(`${API}/${id}/minimo`, {
    ...patch({ stockMinimo }),
    mensajePorDefecto: 'Error al definir el mínimo',
  })
}
