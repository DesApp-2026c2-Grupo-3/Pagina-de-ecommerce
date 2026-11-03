import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { FONDOS, ICONOS } from '../../config/estiloCategoria'
import { slugUnico } from '../../utils/menuResolver'
import type { CategoriaMenu, GrupoMenu, ProductoMenu, SeccionMenu } from '../../types/menu.types'

let contadorClaves = 0

function claveTemporal() {
  contadorClaves += 1
  return `temporal-${Date.now()}-${contadorClaves}`
}

interface EditorMenuProps {
  grupos: GrupoMenu[]
  onChange: (grupos: GrupoMenu[]) => void
  categorias: CategoriaMenu[]
  productos: ProductoMenu[]
}

const campo = 'rounded border bg-white px-2 py-1.5 text-sm'
const botonIcono = 'rounded p-1 hover:bg-gray-100 disabled:opacity-30'

// Mueve un elemento de la lista una posición (-1 arriba, +1 abajo)
function mover<T>(lista: T[], indice: number, delta: -1 | 1): T[] {
  const destino = indice + delta
  if (destino < 0 || destino >= lista.length) return lista
  const copia = [...lista]
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}

// Editor del menú del catálogo: grupos (botones principales) y sus secciones (subcategorías).
// Trabaja sobre un borrador: no guarda nada hasta que el panel lo pide.
export default function EditorMenu({ grupos, onChange, categorias, productos }: EditorMenuProps) {
  const nombreProducto = new Map(productos.map((p) => [p.id, p.nombre]))
  const nombreCategoria = new Map(categorias.map((c) => [c.id, c.nombre]))
  const productosPorCategoria = categorias
    .map((c) => ({ categoria: c, lista: productos.filter((p) => p.categoriaId === c.id) }))
    .filter((x) => x.lista.length > 0)

  const cambiarGrupo = (gi: number, cambios: Partial<GrupoMenu>) =>
    onChange(
      grupos.map((g, i) => {
        if (i !== gi) return g
        const actualizado = { ...g, ...cambios }
        // Mientras es nuevo, el identificador sigue al nombre; una vez guardado no cambia (las URLs dependen de él)
        if (cambios.nombre !== undefined && g.id === undefined) {
          actualizado.slug = slugUnico(cambios.nombre, grupos.filter((_, j) => j !== gi).map((x) => x.slug))
        }
        return actualizado
      }),
    )

  const cambiarSeccion = (gi: number, si: number, cambios: Partial<SeccionMenu>) =>
    onChange(
      grupos.map((g, i) => {
        if (i !== gi) return g
        return {
          ...g,
          secciones: g.secciones.map((s, j) => {
            if (j !== si) return s
            const actualizada = { ...s, ...cambios }
            if (cambios.nombre !== undefined && s.id === undefined) {
              actualizada.slug = slugUnico(cambios.nombre, g.secciones.filter((_, k) => k !== si).map((x) => x.slug))
            }
            return actualizada
          }),
        }
      }),
    )

  const agregarGrupo = () =>
    onChange([
      ...grupos,
      {
        uiKey: claveTemporal(),
          slug: slugUnico('Nuevo grupo', grupos.map((g) => g.slug)),
        nombre: 'Nuevo grupo',
        activo: true,
        porSecciones: false,
        categoriaIds: [],
        secciones: [],
      },
    ])

  const quitarGrupo = (gi: number) => {
    if (window.confirm(`¿Quitar el grupo "${grupos[gi].nombre}" y todas sus secciones del menú? Los productos no se borran.`)) {
      onChange(grupos.filter((_, i) => i !== gi))
    }
  }

  const agregarSeccion = (gi: number) =>
    onChange(
      grupos.map((g, i) =>
        i === gi
          ? {
              ...g,
              secciones: [
                ...g.secciones,
                {
                  uiKey: claveTemporal(),
                  slug: slugUnico('Nueva sección', g.secciones.map((s) => s.slug)),
                  nombre: 'Nueva sección',
                  activo: true,
                  icono: null,
                  fondo: null,
                  categoriaId: null,
                  // La primera sección de un grupo es la que recibe los productos sin ubicar
                  esPorDefecto: g.secciones.length === 0,
                  productoIds: [],
                },
              ],
            }
          : g,
      ),
    )

  const quitarSeccion = (gi: number, si: number) => {
    const grupo = grupos[gi]
    if (!window.confirm(`¿Quitar la sección "${grupo.secciones[si].nombre}"? Los productos no se borran.`)) return
    const secciones = grupo.secciones.filter((_, j) => j !== si)
    // Si se quita la de por defecto, la primera que queda toma su lugar
    const conDefecto = secciones.some((s) => s.esPorDefecto) || secciones.length === 0
      ? secciones
      : secciones.map((s, j) => ({ ...s, esPorDefecto: j === 0 }))
    cambiarGrupo(gi, { secciones: conDefecto })
  }

  const ponerPorDefecto = (gi: number, si: number) =>
    cambiarGrupo(gi, { secciones: grupos[gi].secciones.map((s, j) => ({ ...s, esPorDefecto: j === si })) })

  const alternarCategoria = (gi: number, categoriaId: number) => {
    const g = grupos[gi]
    cambiarGrupo(gi, {
      categoriaIds: g.categoriaIds.includes(categoriaId)
        ? g.categoriaIds.filter((id) => id !== categoriaId)
        : [...g.categoriaIds, categoriaId],
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {grupos.map((grupo, gi) => (
        <details key={grupo.uiKey ?? grupo.id ?? grupo.slug} className="rounded-lg border" open={gi === 0}>
          <summary className="flex cursor-pointer flex-wrap items-center gap-3 p-3">
            <span className="font-bold">{grupo.nombre || 'Sin nombre'}</span>
            <span className="text-xs text-gray-500">
              {grupo.secciones.length} {grupo.secciones.length === 1 ? 'sección' : 'secciones'} · /{grupo.slug}
            </span>
            {!grupo.activo && <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">Oculto</span>}
          </summary>

          <div className="flex flex-col gap-4 border-t p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex">
                <button type="button" onClick={() => onChange(mover(grupos, gi, -1))} disabled={gi === 0} aria-label={`Subir ${grupo.nombre}`} className={botonIcono}>
                  <ArrowUp size={16} />
                </button>
                <button type="button" onClick={() => onChange(mover(grupos, gi, 1))} disabled={gi === grupos.length - 1} aria-label={`Bajar ${grupo.nombre}`} className={botonIcono}>
                  <ArrowDown size={16} />
                </button>
              </div>

              <input
                type="text"
                value={grupo.nombre}
                maxLength={40}
                onChange={(e) => cambiarGrupo(gi, { nombre: e.target.value })}
                aria-label={`Nombre del grupo ${grupo.nombre}`}
                className={`${campo} w-52`}
              />

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={grupo.activo} onChange={(e) => cambiarGrupo(gi, { activo: e.target.checked })} className="h-4 w-4" />
                Visible
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm" title="Con esto, “Todo” se muestra dividido en una sección por subcategoría">
                <input type="checkbox" checked={grupo.porSecciones} onChange={(e) => cambiarGrupo(gi, { porSecciones: e.target.checked })} className="h-4 w-4" />
                Mostrar por secciones
              </label>

              <button type="button" onClick={() => quitarGrupo(gi)} aria-label={`Quitar el grupo ${grupo.nombre}`} title="Quitar grupo" className="ml-auto rounded border bg-red-200 p-1.5 text-danger hover:text-danger-hover">
                <Trash2 size={16} />
              </button>
            </div>

            <div>
              <p className="mb-1 text-sm font-medium">Categorías que entran en el grupo</p>
              <div className="flex flex-wrap gap-2">
                {categorias.map((c) => {
                  const elegida = grupo.categoriaIds.includes(c.id)
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={elegida}
                      onClick={() => alternarCategoria(gi, c.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                        elegida ? 'border-orange-400 bg-orange-50 text-orange-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      {c.nombre}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Secciones (subcategorías)</p>
              {grupo.secciones.length === 0 && (
                <p className="mb-2 text-sm text-gray-500">Sin secciones: el grupo muestra todos sus productos juntos.</p>
              )}

              <ul className="flex flex-col gap-3">
                {grupo.secciones.map((seccion, si) => (
                  <li key={seccion.uiKey ?? seccion.id ?? seccion.slug} className="rounded-lg border bg-gray-50 p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex">
                        <button type="button" onClick={() => cambiarGrupo(gi, { secciones: mover(grupo.secciones, si, -1) })} disabled={si === 0} aria-label={`Subir ${seccion.nombre}`} className={botonIcono}>
                          <ArrowUp size={16} />
                        </button>
                        <button type="button" onClick={() => cambiarGrupo(gi, { secciones: mover(grupo.secciones, si, 1) })} disabled={si === grupo.secciones.length - 1} aria-label={`Bajar ${seccion.nombre}`} className={botonIcono}>
                          <ArrowDown size={16} />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={seccion.nombre}
                        maxLength={40}
                        onChange={(e) => cambiarSeccion(gi, si, { nombre: e.target.value })}
                        aria-label={`Nombre de la sección ${seccion.nombre}`}
                        className={`${campo} w-44`}
                      />

                      <select
                        value={seccion.icono ?? ''}
                        onChange={(e) => cambiarSeccion(gi, si, { icono: e.target.value || null })}
                        aria-label={`Ícono de ${seccion.nombre}`}
                        className={campo}
                      >
                        <option value="">Ícono genérico</option>
                        {ICONOS.map((i) => (
                          <option key={i.valor} value={i.valor}>{i.etiqueta}</option>
                        ))}
                      </select>

                      <select
                        value={seccion.fondo ?? ''}
                        onChange={(e) => cambiarSeccion(gi, si, { fondo: e.target.value || null })}
                        aria-label={`Color de ${seccion.nombre}`}
                        className={campo}
                      >
                        <option value="">Color arena</option>
                        {FONDOS.map((f) => (
                          <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                        ))}
                      </select>

                      <select
                        value={seccion.categoriaId ?? ''}
                        onChange={(e) => cambiarSeccion(gi, si, { categoriaId: e.target.value ? Number(e.target.value) : null })}
                        aria-label={`Categoría automática de ${seccion.nombre}`}
                        className={campo}
                        title="Todos los productos de esta categoría entran solos"
                      >
                        <option value="">Sin categoría automática</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.id}>Toda “{c.nombre}”</option>
                        ))}
                      </select>

                      <label className="flex cursor-pointer items-center gap-2 text-sm" title="Ahí caen los productos del grupo que ninguna sección reclama">
                        <input type="radio" name={`defecto-${gi}`} checked={seccion.esPorDefecto} onChange={() => ponerPorDefecto(gi, si)} className="h-4 w-4" />
                        Por defecto
                      </label>

                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={seccion.activo} onChange={(e) => cambiarSeccion(gi, si, { activo: e.target.checked })} className="h-4 w-4" />
                        Visible
                      </label>

                      <button type="button" onClick={() => quitarSeccion(gi, si)} aria-label={`Quitar la sección ${seccion.nombre}`} title="Quitar sección" className="ml-auto rounded border bg-red-200 p-1.5 text-danger hover:text-danger-hover">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-gray-600">
                        Productos puestos a mano (ganan sobre la categoría
                        {seccion.categoriaId !== null ? ` “${nombreCategoria.get(seccion.categoriaId) ?? ''}”` : ''})
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {seccion.productoIds.map((id) => (
                          <span key={id} className="inline-flex items-center gap-1 rounded-md border bg-white px-2 py-0.5 text-xs">
                            {nombreProducto.get(id) ?? `Producto ${id}`}
                            <button
                              type="button"
                              onClick={() => cambiarSeccion(gi, si, { productoIds: seccion.productoIds.filter((x) => x !== id) })}
                              aria-label={`Quitar ${nombreProducto.get(id) ?? id} de ${seccion.nombre}`}
                              className="text-gray-500 hover:text-danger"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}

                        <select
                          value=""
                          onChange={(e) => e.target.value && cambiarSeccion(gi, si, { productoIds: [...seccion.productoIds, Number(e.target.value)] })}
                          aria-label={`Agregar un producto a ${seccion.nombre}`}
                          className="rounded border bg-white px-2 py-1 text-xs"
                        >
                          <option value="">+ Agregar producto</option>
                          {productosPorCategoria.map(({ categoria, lista }) => (
                            <optgroup key={categoria.id} label={categoria.nombre}>
                              {lista
                                .filter((p) => !seccion.productoIds.includes(p.id))
                                .map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => agregarSeccion(gi)}
                disabled={grupo.secciones.length >= 12}
                className="mt-3 inline-flex items-center gap-1 rounded border border-orange-300 px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50 disabled:opacity-40"
              >
                <Plus size={16} /> Agregar sección
              </button>
            </div>
          </div>
        </details>
      ))}

      <button
        type="button"
        onClick={agregarGrupo}
        disabled={grupos.length >= 20}
        className="inline-flex items-center gap-1 self-start rounded border border-orange-300 px-3 py-1.5 text-sm font-semibold text-action hover:bg-orange-50 disabled:opacity-40"
      >
        <Plus size={16} /> Agregar grupo
      </button>
    </div>
  )
}
