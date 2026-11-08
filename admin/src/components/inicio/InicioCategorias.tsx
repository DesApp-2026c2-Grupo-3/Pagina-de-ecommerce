import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import SeccionDesplegable from '../SeccionDesplegable'
import IconoCategoriaSvg from './IconoCategoriaSvg'
import { useToast } from '../../context/ToastContext'
import { actualizarCategoria, ordenarCategorias } from '../../services/categoriaService'
import { colorDeFondo, estiloDeTarjeta, FONDOS, ICONOS } from '../../config/estiloCategoria'
import type { CategoriaAdmin } from '../../types/categoria.types'

// "" = automático (el que corresponde al nombre)
interface Borrador {
  nombre: string
  icono: string
  fondo: string
}

const desdeCategoria = (c: CategoriaAdmin): Borrador => ({ nombre: c.nombre, icono: c.icono ?? '', fondo: c.fondo ?? '' })

const campo = 'rounded border bg-white px-2 py-1.5 text-sm'

// Una categoría se ve en el Home si está activa y tiene productos (propios o en alguna de sus hijas)
function seMuestra(c: CategoriaAdmin, todas: CategoriaAdmin[]) {
  if (!c.activo) return false
  return c.cantidadProductos > 0 || todas.some((h) => h.categoriaPadreId === c.id && h.activo && h.cantidadProductos > 0)
}

interface TarjetaProps {
  nombre: string
  icono: string
  fondo: string
}

// La tarjeta del Home, a escala chica
function Tarjeta({ nombre, icono, fondo }: TarjetaProps) {
  const estilo = estiloDeTarjeta(nombre, icono || null, fondo || null)
  return (
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border-2 border-[#1a1414] bg-white px-1 pb-2 pt-3 text-center text-[11px] font-bold leading-tight">
      <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ backgroundColor: colorDeFondo(estilo.fondo) }}>
        <IconoCategoriaSvg icono={estilo.icono} tamanio={30} />
      </span>
      <span className="break-words">{nombre || '—'}</span>
    </div>
  )
}

interface InicioCategoriasProps {
  categorias: CategoriaAdmin[]
  /** Se llama después de guardar, para volver a cargar la lista */
  onGuardado: () => Promise<void>
}

// Categorías que forman la fila "Elegí por antojo" del inicio del sitio: las principales, en su orden.
// La vista previa se ve siempre y se actualiza al editar; los cambios se guardan juntos.
export default function InicioCategorias({ categorias, onGuardado }: InicioCategoriasProps) {
  const { mostrarToast } = useToast()

  // Las principales, como las ordena el backend
  const principales = useMemo(() => categorias.filter((c) => c.categoriaPadreId === null), [categorias])
  const firma = principales.map((c) => `${c.id}|${c.nombre}|${c.icono}|${c.fondo}|${c.activo}`).join(',')

  const [ids, setIds] = useState<number[]>(() => principales.map((c) => c.id))
  const [borradores, setBorradores] = useState<Record<number, Borrador>>({})
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  // Al recargar la lista (por ejemplo después de guardar) se vuelve a partir de lo guardado
  useEffect(() => {
    setIds(principales.map((c) => c.id))
    setBorradores({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma])

  const porId = useMemo(() => new Map(principales.map((c) => [c.id, c])), [principales])
  const valorDe = (c: CategoriaAdmin): Borrador => borradores[c.id] ?? desdeCategoria(c)

  const ordenCambio = ids.join(',') !== principales.map((c) => c.id).join(',')

  const cambiadas = principales.filter((c) => {
    const b = borradores[c.id]
    if (!b) return false
    const original = desdeCategoria(c)
    return b.nombre.trim() !== original.nombre || b.icono !== original.icono || b.fondo !== original.fondo
  })
  const hayCambios = ordenCambio || cambiadas.length > 0

  function cambiar(c: CategoriaAdmin, cambios: Partial<Borrador>) {
    setBorradores((prev) => ({ ...prev, [c.id]: { ...valorDe(c), ...cambios } }))
    setError('')
  }

  function mover(id: number, delta: -1 | 1) {
    const posicion = ids.indexOf(id)
    const destino = posicion + delta
    if (destino < 0 || destino >= ids.length) return
    const nuevo = [...ids]
    ;[nuevo[posicion], nuevo[destino]] = [nuevo[destino], nuevo[posicion]]
    setIds(nuevo)
    setError('')
  }

  function descartar() {
    setIds(principales.map((c) => c.id))
    setBorradores({})
    setError('')
  }

  async function guardar() {
    for (const c of cambiadas) {
      const nombre = borradores[c.id].nombre.trim()
      if (nombre.length < 3 || nombre.length > 20) {
        setError(`El nombre "${nombre || c.nombre}" debe tener entre 3 y 20 caracteres.`)
        return
      }
    }

    setGuardando(true)
    setError('')
    try {
      for (const c of cambiadas) {
        const b = borradores[c.id]
        await actualizarCategoria(c.id, { nombre: b.nombre.trim(), icono: b.icono || null, fondo: b.fondo || null })
      }
      if (ordenCambio) await ordenarCategorias(ids)
      mostrarToast('Inicio actualizado!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.')
    } finally {
      setGuardando(false)
      // Se recarga siempre: si algo se guardó antes del error, la lista tiene que reflejarlo
      await onGuardado()
    }
  }

  const visibles = ids.map((id) => porId.get(id)).filter((c): c is CategoriaAdmin => Boolean(c) && seMuestra(c!, categorias))

  const vistaPrevia = (
    <div className="rounded-lg bg-[#fff7e6] p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Así se ve en el inicio</p>
      {visibles.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay categorías con productos para mostrar.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibles.map((c) => {
            const v = valorDe(c)
            return <Tarjeta key={c.id} nombre={v.nombre.trim() || c.nombre} icono={v.icono} fondo={v.fondo} />
          })}
        </div>
      )}
    </div>
  )

  return (
    <SeccionDesplegable
      id="categorias-inicio"
      titulo="Inicio del sitio"
      descripcion="Las tarjetas “Elegí por antojo”: una por categoría principal, en este orden."
      vistaPrevia={vistaPrevia}
    >
      <p className="mb-4 rounded bg-amber-50 p-3 text-sm text-amber-900">
        Ojo: hasta que el menú sea editable, el catálogo agrupa los productos por el nombre de la categoría.
        Si cambiás un nombre, avisá antes para ajustar el menú.
      </p>

      <ul className="flex flex-col gap-3">
        {ids.map((id) => {
          const c = porId.get(id)
          if (!c) return null
          const v = valorDe(c)
          const hijas = categorias.filter((h) => h.categoriaPadreId === c.id)
          const posicion = ids.indexOf(id)
          return (
            <li key={id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => mover(id, -1)}
                  disabled={posicion <= 0}
                  aria-label={`Subir ${c.nombre}`}
                  className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => mover(id, 1)}
                  disabled={posicion === ids.length - 1}
                  aria-label={`Bajar ${c.nombre}`}
                  className="rounded p-0.5 hover:bg-gray-100 disabled:opacity-30"
                >
                  <ArrowDown size={16} />
                </button>
              </div>

              <input
                type="text"
                value={v.nombre}
                maxLength={20}
                onChange={(e) => cambiar(c, { nombre: e.target.value })}
                aria-label={`Nombre de ${c.nombre}`}
                className={`${campo} w-44`}
              />

              <select
                value={v.icono}
                onChange={(e) => cambiar(c, { icono: e.target.value })}
                aria-label={`Ícono de ${c.nombre}`}
                className={campo}
              >
                <option value="">Ícono automático</option>
                {ICONOS.map((i) => (
                  <option key={i.valor} value={i.valor}>{i.etiqueta}</option>
                ))}
              </select>

              <select
                value={v.fondo}
                onChange={(e) => cambiar(c, { fondo: e.target.value })}
                aria-label={`Color de ${c.nombre}`}
                className={campo}
              >
                <option value="">Color automático</option>
                {FONDOS.map((f) => (
                  <option key={f.valor} value={f.valor}>{f.etiqueta}</option>
                ))}
              </select>

              <div className="flex flex-wrap gap-2 text-xs">
                {!c.activo && <span className="rounded-full bg-gray-200 px-2 py-0.5 font-semibold text-gray-600">Deshabilitada: no se muestra</span>}
                {c.activo && !seMuestra(c, categorias) && (
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 font-semibold text-gray-600">Sin productos: no se muestra</span>
                )}
                {hijas.length > 0 && <span className="text-gray-600">Incluye: {hijas.map((h) => h.nombre).join(', ')}</span>}
              </div>
            </li>
          )
        })}
      </ul>

      {error && <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-4 flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={descartar}
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
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </SeccionDesplegable>
  )
}
