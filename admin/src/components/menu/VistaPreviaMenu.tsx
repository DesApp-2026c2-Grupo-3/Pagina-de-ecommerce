import { useEffect, useState } from 'react'
import IconoCategoriaSvg from '../inicio/IconoCategoriaSvg'
import { colorDeFondo, estiloDeTarjeta } from '../../config/estiloCategoria'
import { ubicar } from '../../utils/menuResolver'
import type { CategoriaMenu, GrupoMenu, ProductoMenu, SeccionMenu } from '../../types/menu.types'

interface VistaPreviaMenuProps {
  grupos: GrupoMenu[]
  productos: ProductoMenu[]
  categorias: CategoriaMenu[]
}

const boton = (activo: boolean) =>
  `rounded-full border-2 border-[#1a1414] px-3 py-1 text-xs font-bold transition-colors ${
    activo ? 'bg-[#ffb81c]' : 'bg-white hover:bg-[#fff7e6]'
  }`

// Título de una sección con su ícono, como se ve en el catálogo
function TituloSeccion({ seccion }: { seccion: SeccionMenu }) {
  const estilo = estiloDeTarjeta(seccion.nombre, seccion.icono, seccion.fondo)
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-lg" style={{ backgroundColor: colorDeFondo(estilo.fondo) }}>
        <IconoCategoriaSvg icono={estilo.icono} tamanio={22} />
      </span>
      <span className="text-sm font-extrabold">{seccion.nombre}</span>
    </div>
  )
}

// El catálogo del cliente a escala chica: botones de grupo, de sección y los productos de cada una.
// Se arma con el menú que se está editando, así se ve el resultado antes de guardar.
export default function VistaPreviaMenu({ grupos, productos, categorias }: VistaPreviaMenuProps) {
  const visibles = grupos.filter((g) => g.activo)
  const [grupoSlug, setGrupoSlug] = useState<string | null>(visibles[0]?.slug ?? null)
  const [seccionSlug, setSeccionSlug] = useState<string | null>(null)

  // Si el grupo elegido ya no existe (se borró o se deshabilitó), se vuelve al primero
  useEffect(() => {
    if (!visibles.some((g) => g.slug === grupoSlug)) {
      setGrupoSlug(visibles[0]?.slug ?? null)
      setSeccionSlug(null)
    }
  }, [visibles, grupoSlug])

  // Productos que no caen en ningún grupo habilitado: el cliente no los ve en el catálogo
  // (por ejemplo, los de una categoría nueva que todavía no se agregó a un grupo)
  const sinGrupo = productos.filter((p) => !visibles.some((g) => ubicar(g, p).pertenece))

  const grupo = visibles.find((g) => g.slug === grupoSlug)
  if (!grupo) {
    return <p className="rounded-lg bg-[#fff7e6] p-3 text-sm text-gray-500">No hay grupos habilitados para mostrar.</p>
  }

  const secciones = grupo.secciones.filter((s) => s.activo)
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]))

  // Productos del grupo, repartidos por sección (y los que no caen en ninguna)
  const porSeccion = new Map<string, ProductoMenu[]>()
  const sinSeccion: ProductoMenu[] = []
  const sueltos: ProductoMenu[] = []
  for (const producto of productos) {
    const { pertenece, seccion } = ubicar(grupo, producto)
    if (!pertenece) continue
    if (secciones.length === 0) sueltos.push(producto)
    else if (seccion) porSeccion.set(seccion.slug, [...(porSeccion.get(seccion.slug) ?? []), producto])
    else sinSeccion.push(producto)
  }

  const mostradas = seccionSlug ? secciones.filter((s) => s.slug === seccionSlug) : secciones

  const chips = (lista: ProductoMenu[]) => (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {lista.map((p) => (
        <span
          key={p.id}
          title={nombreCategoria.get(p.categoriaId)}
          className="rounded-md border border-[#1a1414]/30 bg-white px-2 py-0.5 text-[11px]"
        >
          {p.nombre}
        </span>
      ))}
      {lista.length === 0 && <span className="text-[11px] text-gray-400">Sin productos</span>}
    </div>
  )

  return (
    <div className="rounded-lg bg-[#fff7e6] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Así se ve el catálogo</p>

      <div className="flex flex-wrap gap-2">
        {visibles.map((g) => (
          <button
            key={g.slug}
            type="button"
            onClick={() => {
              setGrupoSlug(g.slug)
              setSeccionSlug(null)
            }}
            className={boton(g.slug === grupo.slug)}
          >
            {g.nombre || '—'}
          </button>
        ))}
      </div>

      {secciones.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#1a1414]/10 pt-3">
          <button type="button" onClick={() => setSeccionSlug(null)} className={boton(seccionSlug === null)}>
            Todo
          </button>
          {secciones.map((s) => (
            <button key={s.slug} type="button" onClick={() => setSeccionSlug(s.slug)} className={boton(seccionSlug === s.slug)}>
              {s.nombre || '—'}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {secciones.length === 0 ? (
          chips(sueltos)
        ) : (
          mostradas.map((s) => (
            <div key={s.slug}>
              <TituloSeccion seccion={s} />
              {chips(porSeccion.get(s.slug) ?? [])}
            </div>
          ))
        )}
      </div>

      {sinGrupo.length > 0 && (
        <p className="mt-4 rounded bg-amber-100 p-2 text-xs text-amber-900">
          {sinGrupo.length} producto(s) no aparecen en ningún grupo del catálogo:{' '}
          {sinGrupo.slice(0, 6).map((p) => p.nombre).join(', ')}
          {sinGrupo.length > 6 ? '…' : ''}. Sumá su categoría a un grupo, o ponelos a mano en una sección.
        </p>
      )}

      {sinSeccion.length > 0 && (
        <p className="mt-4 rounded bg-amber-100 p-2 text-xs text-amber-900">
          {sinSeccion.length} producto(s) del grupo no caen en ninguna sección: elegí una sección por defecto.
        </p>
      )}
    </div>
  )
}
