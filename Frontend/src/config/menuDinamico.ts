import type { Category, ProductoBackend } from '../types/product'
import type { MenuApi } from '../types/menu'
import type { GrupoCatalogo, SubgrupoCatalogo } from './gruposCatalogo'

/**
 * Convierte el menú que arma el master (GET /menu, con ids) a la forma que usa el catálogo
 * (GrupoCatalogo, con nombres), para que ubicarEnGrupo y compañía sigan funcionando igual.
 *
 *  - la categoría automática de una sección y las categorías de un grupo pasan de id a nombre;
 *  - los productos puestos a mano pasan de id a nombre (los que no están en el catálogo de la zona se omiten);
 *  - el ícono y el color de la sección mandan sobre `estilo`, que queda como respaldo.
 */
export function armarGrupos(menu: MenuApi, categorias: Category[], productos: ProductoBackend[]): GrupoCatalogo[] {
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]))
  const nombreProducto = new Map(productos.map((p) => [p.id, p.nombre]))

  const nombresDe = (ids: number[], nombres: Map<number, string>) =>
    ids.map((id) => nombres.get(id)).filter((nombre): nombre is string => nombre !== undefined)

  return menu.grupos.map((grupo) => {
    const subgrupos: SubgrupoCatalogo[] = grupo.secciones.map((seccion) => {
      const categoria = seccion.categoriaId === null ? undefined : nombreCategoria.get(seccion.categoriaId)
      const manuales = nombresDe(seccion.productoIds, nombreProducto)
      return {
        slug: seccion.slug,
        nombre: seccion.nombre,
        // Sin ícono ni color propios, toma los de su categoría (o los genéricos)
        estilo: categoria ?? '',
        ...(seccion.icono ? { icono: seccion.icono } : {}),
        ...(seccion.fondo ? { fondo: seccion.fondo } : {}),
        ...(categoria ? { categorias: [categoria] } : {}),
        ...(manuales.length > 0 ? { productos: manuales } : {}),
      }
    })

    return {
      id: grupo.id,
      slug: grupo.slug,
      nombre: grupo.nombre,
      categorias: nombresDe(grupo.categoriaIds, nombreCategoria),
      ...(subgrupos.length > 0 ? { subgrupos } : {}),
      subgrupoPorDefecto: grupo.secciones.find((s) => s.esPorDefecto)?.slug,
      porSecciones: grupo.porSecciones,
    }
  })
}
