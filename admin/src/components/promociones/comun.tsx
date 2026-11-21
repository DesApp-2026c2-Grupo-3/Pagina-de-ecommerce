// Piezas que comparten los bloques de la pantalla de Promociones
import type { ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'

export const formatearPrecio = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`

// Colores de la tienda, para que la vista previa se vea como la ve el cliente
export const MARCA = {
  rojo: '#e4002b',
  oscuro: '#1a1414',
  crema: '#fff7e6',
  mostaza: '#ffb81c',
}

export const etiqueta = 'mb-1 block text-sm font-semibold'
export const ayuda = 'mt-1 text-xs text-gray-600'
export const campo = 'w-full rounded border bg-white px-3 py-2'
export const chip = (elegido: boolean) =>
  `rounded border px-3 py-1.5 text-sm font-semibold transition-colors ${
    elegido ? 'border-orange-400 bg-orange-100 text-orange-800' : 'bg-white text-gray-700 hover:bg-gray-50'
  }`
export const botonPrimario =
  'rounded border border-orange-300 bg-action px-4 py-2 font-semibold text-white transition-colors hover:bg-action-hover disabled:opacity-50'
export const botonSecundario = 'rounded border bg-white px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-50'

export function ErrorCampo({ mensaje }: { mensaje?: string }) {
  if (!mensaje) return null
  return <p className="mt-1 text-sm font-medium text-red-700">{mensaje}</p>
}

interface TarjetaBloqueProps {
  numero: number
  lugar: string
  titulo: string
  /** Lo que está publicado ahora (se ve con la tarjeta cerrada) */
  resumen: ReactNode
  abierta: boolean
  onAbrir: () => void
  /** Colores de la tarjeta: los mismos que tiene ese bloque en la tienda */
  tono: 'rojo' | 'amarillo' | 'neutro'
  children: ReactNode
}

const TONOS = {
  rojo: { tarjeta: 'border-red-300 bg-red-50', lugar: 'text-red-700', titulo: 'text-red-900', linea: 'border-red-200' },
  amarillo: { tarjeta: 'border-amber-300 bg-amber-50', lugar: 'text-amber-700', titulo: 'text-amber-900', linea: 'border-amber-200' },
  neutro: { tarjeta: 'bg-white', lugar: 'text-gray-500', titulo: 'text-gray-900', linea: 'border-gray-200' },
}

// Una parte de la página de Promos: cerrada muestra lo publicado, abierta despliega su editor
export function TarjetaBloque({ numero, lugar, titulo, resumen, abierta, onAbrir, tono, children }: TarjetaBloqueProps) {
  const t = TONOS[tono]
  return (
    <section className={`rounded-xl border p-4 sm:p-5 ${t.tarjeta}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${t.lugar}`}>
            {numero} · {lugar}
          </p>
          <h2 className={`text-lg font-bold ${t.titulo}`}>{titulo}</h2>
          <div className={`mt-1 text-sm ${t.titulo}`}>{resumen}</div>
        </div>
        {!abierta && (
          <button type="button" onClick={onAbrir} className="shrink-0 rounded border bg-white px-4 py-1.5 text-sm font-semibold hover:bg-gray-50">
            Cambiar
          </button>
        )}
      </div>
      {abierta && <div className={`mt-4 border-t pt-4 ${t.linea}`}>{children}</div>}
    </section>
  )
}

// Editor a la izquierda, vista previa a la derecha (una debajo de la otra en el celular)
export function EditorConVista({ editor, vista }: { editor: ReactNode; vista: ReactNode }) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-lg border bg-white p-4">{editor}</div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Así lo ve el cliente</p>
        {vista}
      </div>
    </div>
  )
}

interface SelectProductoProps {
  id: string
  productos: ProductoOpcion[]
  valor: number | null
  onChange: (id: number | null) => void
  className?: string
}

export function SelectProducto({ id, productos, valor, onChange, className = campo }: SelectProductoProps) {
  return (
    <select
      id={id}
      value={valor ?? ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className={className}
    >
      <option value="">Elegí un producto</option>
      {productos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombre} · {formatearPrecio(p.precio)}
        </option>
      ))}
    </select>
  )
}

export function Cantidad({ valor, onChange, etiquetaAccesible }: { valor: number; onChange: (n: number) => void; etiquetaAccesible: string }) {
  const boton = 'grid h-9 w-9 place-items-center rounded border bg-white hover:bg-gray-50 disabled:opacity-40'
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={etiquetaAccesible}>
      <button type="button" className={boton} onClick={() => onChange(valor - 1)} disabled={valor <= 1} aria-label="Una menos">
        <Minus size={16} />
      </button>
      <span className="w-7 text-center font-semibold" aria-live="polite">{valor}</span>
      <button type="button" className={boton} onClick={() => onChange(valor + 1)} disabled={valor >= 20} aria-label="Una más">
        <Plus size={16} />
      </button>
    </div>
  )
}

export function Acciones({
  guardando,
  onCancelar,
  onGuardar,
  textoGuardar = 'Guardar cambios',
  extra,
}: {
  guardando: boolean
  onCancelar: () => void
  onGuardar: () => void
  textoGuardar?: string
  /** Botones a la izquierda (pausar, eliminar...) */
  extra?: ReactNode
}) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
      {extra && <div className="flex flex-wrap gap-2 sm:mr-auto">{extra}</div>}
      <div className="flex flex-col-reverse gap-2 sm:ml-auto sm:flex-row">
        <button type="button" onClick={onCancelar} disabled={guardando} className={botonSecundario}>
          Cancelar
        </button>
        <button type="button" onClick={onGuardar} disabled={guardando} className={botonPrimario}>
          {guardando ? 'Guardando...' : textoGuardar}
        </button>
      </div>
    </div>
  )
}

export function ErrorGeneral({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null
  return <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{mensaje}</p>
}
