import { DIAS } from '../../config/promociones'
import type { PromocionAdmin } from '../../types/promocion.types'

// Textos de cada promoción, movidos tal cual desde la página de Promociones.

// «Mar · Jue» para las promos del día (lunes primero); «Toda la semana» para las otras
export const cuando = (p: PromocionAdmin) =>
  p.tipo === 'DIA'
    ? DIAS.filter((d) => p.dias.includes(d.valor)).map((d) => d.corto).join(' · ')
    : 'Toda la semana'

export const porcentaje = (descuento: number) => `${Math.round(descuento * 1000) / 10}%`

// «2× Hamburguesa Bacon · 1× Papas gratis · 1× Gaseosa (20% menos)»
export const resumen = (p: PromocionAdmin) =>
  p.items
    .map((i) => {
      const nombre = i.nombre ?? 'Producto eliminado'
      const oferta = i.descuento >= 1 ? ' gratis' : i.descuento > 0 ? ` (${porcentaje(i.descuento)} menos)` : ''
      return `${i.cantidad}× ${nombre}${oferta}`
    })
    .join(' · ')
