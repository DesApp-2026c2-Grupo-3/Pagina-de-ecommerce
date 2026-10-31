import type { TipoPromo } from '../types/promocion.types'

// Reglas de las promociones (las mismas que valida el backend)
export const MAX_PROMOS_POR_DIA = 3

export const TIPOS_PROMO: { valor: TipoPromo; titulo: string; detalle: string }[] = [
  { valor: 'SEMANA', titulo: 'Producto de la semana', detalle: 'Un producto con descuento todos los días. Hay uno solo activo.' },
  { valor: 'REGALO', titulo: 'Regalo de la semana', detalle: 'Un producto sin cargo con compra mínima. Hay uno solo activo.' },
  { valor: 'DIA', titulo: 'Promo del día', detalle: `Vale solo los días que elijas. Hasta ${MAX_PROMOS_POR_DIA} activas por día.` },
]

export const NOMBRE_TIPO: Record<TipoPromo, string> = {
  SEMANA: 'Producto de la semana',
  REGALO: 'Regalo de la semana',
  DIA: 'Promo del día',
}

// Orden en que se muestran los días en el panel y en la página de Promos (0 = domingo)
export const DIAS: { valor: number; corto: string; nombre: string }[] = [
  { valor: 1, corto: 'Lun', nombre: 'Lunes' },
  { valor: 2, corto: 'Mar', nombre: 'Martes' },
  { valor: 3, corto: 'Mié', nombre: 'Miércoles' },
  { valor: 4, corto: 'Jue', nombre: 'Jueves' },
  { valor: 5, corto: 'Vie', nombre: 'Viernes' },
  { valor: 6, corto: 'Sáb', nombre: 'Sábado' },
  { valor: 0, corto: 'Dom', nombre: 'Domingo' },
]
