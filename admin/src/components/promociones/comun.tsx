// Piezas que comparten los bloques de la pantalla de Promociones
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
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
  children: ReactNode
}

// Todas las tarjetas son iguales (sin colores): el color queda solo en la vista previa de la tienda
const ESTILO_TARJETA = { tarjeta: 'bg-white', lugar: 'text-gray-500', titulo: 'text-gray-900', linea: 'border-gray-200' }

// Una parte de la página de Promos: cerrada muestra lo publicado, abierta despliega su editor
export function TarjetaBloque({ numero, lugar, titulo, resumen, abierta, onAbrir, children }: TarjetaBloqueProps) {
  const t = ESTILO_TARJETA
  // Al abrirse (por ejemplo, con «Editar» desde la lista de abajo) se lleva la vista hasta la tarjeta
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (abierta) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [abierta])
  return (
    <section ref={ref} className={`scroll-mt-4 rounded-xl border p-4 sm:p-5 ${t.tarjeta}`}>
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

// Sin tildes ni mayúsculas: "cafe" encuentra "Café"
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const MAX_RESULTADOS = 50

// Selector de producto con búsqueda: se escribe y la lista se va filtrando (son muchos productos).
// Flechas para moverse, Enter para elegir, Escape para cerrar.
export function SelectProducto({ id, productos, valor, onChange, className = campo }: SelectProductoProps) {
  const elegido = productos.find((p) => p.id === valor) ?? null
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const refLista = useRef<HTMLUListElement>(null)

  const buscado = normalizar(texto)
  const resultados = (buscado ? productos.filter((p) => normalizar(p.nombre).includes(buscado)) : productos).slice(0, MAX_RESULTADOS)

  function elegir(p: ProductoOpcion) {
    onChange(p.id)
    setAbierto(false)
    setTexto('')
  }

  function teclado(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setAbierto(true)
      setActivo((a) => Math.min(a + 1, resultados.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActivo((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && abierto) {
      e.preventDefault()
      if (resultados[activo]) elegir(resultados[activo])
    } else if (e.key === 'Escape') {
      setAbierto(false)
      setTexto('')
    }
  }

  // La opción marcada con las flechas siempre queda a la vista
  useEffect(() => {
    refLista.current?.children[activo]?.scrollIntoView({ block: 'nearest' })
  }, [activo])

  return (
    <div className={`relative ${className.includes('flex-1') ? 'min-w-0 flex-1' : 'w-full'}`}>
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        autoComplete="off"
        value={abierto ? texto : elegido ? `${elegido.nombre} · ${formatearPrecio(elegido.precio)}` : ''}
        placeholder={elegido ? 'Escribí para cambiarlo' : 'Escribí para buscar un producto'}
        onFocus={() => { setAbierto(true); setTexto(''); setActivo(0) }}
        onBlur={() => { setAbierto(false); setTexto('') }}
        onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActivo(0) }}
        onKeyDown={teclado}
        className={campo}
      />
      {abierto && (
        <ul
          ref={refLista}
          id={`${id}-lista`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border bg-white py-1 shadow-lg"
        >
          {resultados.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-500">No hay productos con «{texto}»</li>
          ) : (
            resultados.map((p, i) => (
              <li
                key={p.id}
                role="option"
                aria-selected={p.id === valor}
                // mousedown en vez de click: así se elige antes de que el campo pierda el foco
                onMouseDown={(e) => { e.preventDefault(); elegir(p) }}
                onMouseEnter={() => setActivo(i)}
                className={`flex cursor-pointer justify-between gap-3 px-3 py-2 text-sm ${
                  i === activo ? 'bg-orange-100' : ''
                } ${p.id === valor ? 'font-semibold' : ''}`}
              >
                <span className="min-w-0 truncate">{p.nombre}</span>
                <span className="shrink-0 text-gray-500">{formatearPrecio(p.precio)}</span>
              </li>
            ))
          )}
          {!buscado && productos.length > MAX_RESULTADOS && (
            <li className="px-3 py-2 text-xs text-gray-500">Mostrando {MAX_RESULTADOS} de {productos.length}. Escribí para encontrar el resto.</li>
          )}
        </ul>
      )}
    </div>
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
