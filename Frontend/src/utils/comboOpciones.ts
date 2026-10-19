import type { ComboGrupo, ProductoBackend } from '../types/product'
import type { OpcionElegible } from '../components/product/ChoiceSheet'

/** Valor de la elección cuando el cliente pide el combo SIN ese lugar (ej: sin bebida). Mismo precio. */
export const SIN_OPCION = 0

// Precio de un producto en un tamaño (o el precio único si no tiene tamaños)
export function precioEn(p: ProductoBackend, tamanioId: number | null): number | null {
  if (!p.tamanios || p.tamanios.length === 0) return Number(p.precio)
  const t = p.tamanios.find((x) => x.tamanioId === tamanioId)
  return t ? Number(t.precio) : null
}

// Opciones de un lugar del combo, con lo que cuestan de más que la opción incluida (la más barata)
export function opcionesDeGrupo(
  grupo: ComboGrupo,
  catalogo: ProductoBackend[],
  tamanioId: number | null,
): OpcionElegible[] {
  const delGrupo = catalogo.filter((p) => p.categoriaId === grupo.categoriaId)
  const precios = delGrupo.map((p) => precioEn(p, tamanioId)).filter((x): x is number => x !== null)
  const referencia = precios.length > 0 ? Math.min(...precios) : null

  return delGrupo
    .filter((p) => p.disponible && precioEn(p, tamanioId) !== null)
    .map((p) => ({
      id: p.id,
      nombre: p.nombre,
      imagen: p.imagen,
      icono: grupo.icono ?? '🍽️',
      recargo: referencia === null ? 0 : Math.max(0, (precioEn(p, tamanioId) ?? 0) - referencia),
    }))
}

/** Lo que viene por defecto: la opción incluida del combo, o la primera sin recargo */
export function eleccionPorDefecto(grupo: ComboGrupo, opciones: OpcionElegible[]): number | undefined {
  return (
    opciones.find((o) => o.id === grupo.productoIncluidoId)?.id ??
    opciones.find((o) => o.recargo === 0)?.id ??
    opciones[0]?.id
  )
}

/** "Una bebida" → "Sin bebida", "Acompañamiento" → "Sin acompañamiento" */
export function textoSin(grupo: ComboGrupo) {
  return `Sin ${grupo.nombre.replace(/^(una?|el|la)\s+/i, '').toLowerCase()}`
}