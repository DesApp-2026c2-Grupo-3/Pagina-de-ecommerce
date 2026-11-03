import { useEffect, useMemo, useState } from 'react'
import SeccionDesplegable from '../../components/SeccionDesplegable'
import EditorMenu from '../../components/menu/EditorMenu'
import VistaPreviaMenu from '../../components/menu/VistaPreviaMenu'
import { useToast } from '../../context/ToastContext'
import { obtenerCategorias } from '../../services/categoriaService'
import { obtenerProductos } from '../../services/productoService'
import { guardarMenu, obtenerMenu } from '../../services/menuService'
import type { CategoriaMenu, GrupoMenu, ProductoMenu } from '../../types/menu.types'

// Menú del catálogo: los botones de grupo y de subcategoría que ve el cliente, y qué productos van en cada uno.
// Solo el Admin-Master. Se edita un borrador con vista previa en vivo y se guarda todo junto.
export default function Menu() {
  const { mostrarToast } = useToast()

  const [original, setOriginal] = useState<GrupoMenu[]>([])
  const [grupos, setGrupos] = useState<GrupoMenu[]>([])
  const [categorias, setCategorias] = useState<CategoriaMenu[]>([])
  const [productos, setProductos] = useState<ProductoMenu[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([obtenerMenu(), obtenerCategorias(), obtenerProductos()])
      .then(([menu, cats, prods]) => {
        setOriginal(menu.grupos)
        setGrupos(menu.grupos)
        setCategorias(cats.map((c: { id: number; nombre: string }) => ({ id: c.id, nombre: c.nombre })))
        setProductos(
          prods
            .filter((p: { categoriaId: number | null }) => p.categoriaId !== null)
            .map((p: { id: number; nombre: string; categoriaId: number }) => ({ id: p.id, nombre: p.nombre, categoriaId: p.categoriaId })),
        )
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar el menú.'))
      .finally(() => setCargando(false))
  }, [])

  const hayCambios = useMemo(() => JSON.stringify(grupos) !== JSON.stringify(original), [grupos, original])

  function cambiar(nuevos: GrupoMenu[]) {
    setGrupos(nuevos)
    setError('')
  }

  async function guardar() {
    setGuardando(true)
    setError('')
    try {
      const guardado = await guardarMenu({ grupos })
      setOriginal(guardado.grupos)
      setGrupos(guardado.grupos)
      mostrarToast('Menú guardado!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el menú.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Catálogo del sitio</p>
        <h1 className="text-3xl font-bold">Menú</h1>
        <p className="mt-2 text-gray-600">
          Los botones del catálogo (grupos y subcategorías) y qué productos van en cada uno. Las categorías siguen siendo
          las mismas: acá solo se decide cómo se muestran.
        </p>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="text-gray-600">Cargando...</p>
      ) : (
        <SeccionDesplegable
          id="menu-editor"
          titulo="Menú del catálogo"
          descripcion="La vista previa se actualiza mientras editás; los cambios se aplican al guardar."
          vistaPrevia={<VistaPreviaMenu grupos={grupos} productos={productos} categorias={categorias} />}
        >
          <div className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
            <p>
              Dentro de un grupo, un producto puesto a mano en una sección <strong>gana</strong> sobre la categoría automática.
              Un mismo producto puede estar en varias secciones. La sección <strong>por defecto</strong> recibe los productos
              del grupo que ninguna otra reclama (por ejemplo, un producto nuevo).
            </p>
          </div>

          <EditorMenu grupos={grupos} onChange={cambiar} categorias={categorias} productos={productos} />

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => cambiar(original)}
              disabled={!hayCambios || guardando}
              className="rounded border px-4 py-2 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              Descartar cambios
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!hayCambios || guardando}
              className="rounded border border-orange-300 bg-action px-4 py-2 text-white transition-colors hover:bg-action-hover disabled:opacity-40"
            >
              {guardando ? 'Guardando...' : 'Guardar menú'}
            </button>
          </div>
        </SeccionDesplegable>
      )}
    </main>
  )
}
