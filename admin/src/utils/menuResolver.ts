import type { GrupoMenu, ProductoMenu, SeccionMenu } from '../types/menu.types'

// Dónde cae un producto dentro de un grupo. Es la misma regla que usa el catálogo del cliente
// (Frontend/src/config/gruposCatalogo.ts → ubicarEnGrupo), pero con ids:
//   1. lo puesto a mano en una sección gana;
//   2. si no, la sección cuya categoría automática es la del producto;
//   3. si no, y el producto es de una categoría del grupo, la sección por defecto.
export function ubicar(grupo: GrupoMenu, producto: ProductoMenu): { pertenece: boolean; seccion?: SeccionMenu } {
  const secciones = grupo.secciones.filter((s) => s.activo)
  const enCategoria = grupo.categoriaIds.includes(producto.categoriaId)
  if (secciones.length === 0) return { pertenece: enCategoria }

  const manual = secciones.find((s) => s.productoIds.includes(producto.id))
  if (manual) return { pertenece: true, seccion: manual }

  const porCategoria = secciones.find((s) => s.categoriaId !== null && s.categoriaId === producto.categoriaId)
  if (porCategoria) return { pertenece: true, seccion: porCategoria }

  if (enCategoria) return { pertenece: true, seccion: secciones.find((s) => s.esPorDefecto) }
  return { pertenece: false }
}

// "Para acompañar" → "para-acompanar": el identificador que usan las URLs
export function slugificar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// Un identificador que no se repita entre los existentes (agrega -2, -3...)
export function slugUnico(base: string, existentes: string[]): string {
  const raiz = slugificar(base) || 'nuevo'
  if (!existentes.includes(raiz)) return raiz
  let n = 2
  while (existentes.includes(`${raiz.slice(0, 36)}-${n}`)) n++
  return `${raiz.slice(0, 36)}-${n}`
}
