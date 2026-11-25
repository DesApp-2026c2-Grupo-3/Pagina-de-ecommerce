import { PARAM_VISTA } from './parametros'

export type VistaStock = 'insumos' | 'movimientos'

export function esVistaStock(valor: unknown): valor is VistaStock {
  return valor === 'insumos' || valor === 'movimientos'
}

// /admin/sucursales/3/stock (Insumos, por defecto) o /admin/sucursales/3/stock?vista=movimientos
export function rutaStock(sucursalId: number, vista: VistaStock = 'insumos'): string {
  const base = `/admin/sucursales/${sucursalId}/stock`
  return vista === 'movimientos' ? `${base}?${PARAM_VISTA}=movimientos` : base
}

export function rutaReportarBaja(sucursalId: number): string {
  return `/admin/sucursales/${sucursalId}/stock/baja`
}

// A dónde vuelve «Reportar baja»: a la vista de Stock de la que vino (dato externo: se valida)
export function destinoVolverStock(estado: unknown, sucursalId: number): string {
  const base = `/admin/sucursales/${sucursalId}/stock`
  if (typeof estado === 'object' && estado !== null && 'desde' in estado) {
    const desde = (estado as { desde: unknown }).desde
    if (typeof desde === 'string' && (desde === base || desde.startsWith(`${base}?`))) return desde
  }
  return base
}
