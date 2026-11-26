import type { ItemStock } from '../../types/stock.types'

export interface FormBaja {
  stockId: string
  cantidad: string
  motivo: string
  detalle: string
}

export const FORM_BAJA_VACIO: FormBaja = { stockId: '', cantidad: '', motivo: '', detalle: '' }

// Mismas validaciones y textos que el formulario anterior (RN-10: la baja requiere motivo)
export function validarBaja(form: FormBaja): string | null {
  const cantidad = Number(form.cantidad)
  if (!form.stockId) return 'Elegí el insumo.'
  if (!Number.isInteger(cantidad) || cantidad <= 0) return 'Ingresá una cantidad entera mayor a 0.'
  if (!form.motivo) return 'Elegí el motivo de la baja.'
  if (form.motivo === 'otro' && form.detalle.trim().length < 5) {
    return 'Contá brevemente el motivo (al menos 5 caracteres).'
  }
  return null
}

// Ayuda en vivo, solo informativa: la validación real la hace el backend (el stock nunca queda negativo)
export function textoAyudaBaja(item: ItemStock | undefined, cantidadTexto: string): string | null {
  const cantidad = Number(cantidadTexto)
  if (!item || !cantidadTexto || !Number.isInteger(cantidad) || cantidad <= 0) return null
  if (cantidad > item.cantidad) {
    return `Hay ${item.cantidad.toLocaleString('es-AR')}: no alcanza para bajar ${cantidad.toLocaleString('es-AR')}.`
  }
  const quedarian = item.cantidad - cantidad
  const texto = `Quedarían ${quedarian.toLocaleString('es-AR')}`
  if (item.activo && item.stockMinimo != null && quedarian <= item.stockMinimo) {
    return `${texto}: en el mínimo o por debajo (${item.stockMinimo}), queda en alerta de reposición.`
  }
  return `${texto}.`
}
