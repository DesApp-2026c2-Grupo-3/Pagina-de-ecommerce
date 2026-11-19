import { useEffect, useRef, useState } from 'react'
import { Check, Eye, EyeOff, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react'

const MAX_CARACTERES = 100

// ==========================================
// CONSTANTES DE ESTILO (Alineado con CartItemRow)
// ==========================================
const tarjetaContenedorClase = 'w-full rounded-2xl border-2 border-brand-dark bg-white px-3 py-2.5 sm:px-4 sm:py-3'

const textareaNotaClase =
  'w-full resize-none rounded-xl border border-brand-dark/30 bg-brand-cream/40 px-3 py-1.5 text-xs text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-dark focus:bg-white focus:outline-none sm:text-sm'

const botonEdicionBaseClase =
  'inline-flex h-8 w-8 shrink-0 items-center justify-center gap-1.5 rounded-full border-2 border-brand-dark text-xs font-bold transition-colors sm:h-9 sm:w-auto sm:px-3.5 disabled:cursor-not-allowed disabled:opacity-40'

// Mismo tamaño, forma y color negro que los botones de CartItemRow
const botonIconoCardClase =
  'grid h-8 w-8 shrink-0 place-items-center rounded-xl text-brand-dark transition-colors sm:h-9 sm:w-9'

const botonAgregarNotaClase =
  'flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-brand-dark/35 bg-white/80 px-3 py-2.5 text-left text-sm font-bold text-brand-dark transition-colors hover:border-brand-dark hover:bg-white sm:px-4'

interface NotaCocinaProps {
  /** La nota ya guardada ('' si no hay). Solo esta viaja con el pedido. */
  guardada: string
  onGuardar: (nota: string) => void
}

export default function NotaCocina({ guardada, onGuardar }: NotaCocinaProps) {
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')
  const [verCompleta, setVerCompleta] = useState(false)

  const areaRef = useRef<HTMLTextAreaElement>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const eraEdicion = useRef(false)

  useEffect(() => {
    if (editando) areaRef.current?.focus()
    else if (eraEdicion.current) botonRef.current?.focus()
    eraEdicion.current = editando
  }, [editando])

  function abrir() {
    setBorrador(guardada)
    setEditando(true)
  }

  function descartar() {
    setEditando(false)
    setBorrador('')
  }

  function guardar() {
    const nota = borrador.trim()
    if (!nota) return
    onGuardar(nota)
    setVerCompleta(false)
    setEditando(false)
  }

  function quitar() {
    onGuardar('')
    setVerCompleta(false)
  }

  // 1. MODO EDICIÓN
  if (editando) {
    const sinGuardar = borrador.trim() !== '' && borrador.trim() !== guardada

    return (
      <div className={tarjetaContenedorClase}>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label htmlFor="nota-cocina" className="text-sm font-extrabold text-brand-dark sm:text-base">
            Notas para la cocina
          </label>
          <span className="shrink-0 text-[11px] font-semibold text-brand-muted">
            {borrador.length}/{MAX_CARACTERES}
          </span>
        </div>

        <textarea
          id="nota-cocina"
          ref={areaRef}
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') descartar()
          }}
          maxLength={MAX_CARACTERES}
          placeholder="Ej.: sin cebolla, bien cocida..."
          rows={2}
          className={textareaNotaClase}
        />

        <div className="mt-2 flex w-full flex-row items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            {sinGuardar && (
              <p className="break-words pr-1 text-xs font-semibold leading-tight text-brand-muted sm:text-sm">
                Guarda para que se envíe con el pedido.
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-row items-center gap-1.5">
            <button
              type="button"
              onClick={descartar}
              className={`${botonEdicionBaseClase} bg-red-50 text-red-600 hover:bg-red-100`}
              title="Descartar cambios"
              aria-label="Descartar cambios"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Descartar</span>
            </button>

            <button
              type="button"
              onClick={guardar}
              disabled={borrador.trim() === ''}
              className={`${botonEdicionBaseClase} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
              title="Guardar nota"
              aria-label="Guardar nota"
            >
              <Check className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 2. MODO NOTA GUARDADA (Título más grande + botones negros alineados con CartItemRow)
  if (guardada) {
    return (
      <div className={tarjetaContenedorClase}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-brand-dark sm:text-base">Notas para la cocina</p>

            <div className="mt-1">
              {verCompleta ? (
                <p className="break-words text-xs font-medium text-brand-dark sm:text-sm">{guardada}</p>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-brand-cream px-2 py-0.5 text-[11px] font-semibold text-brand-muted">
                  <EyeOff className="h-3 w-3 shrink-0" />
                  Nota oculta
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={() => setVerCompleta((v) => !v)}
              aria-label={verCompleta ? 'Ocultar la nota completa' : 'Ver la nota completa'}
              aria-pressed={verCompleta}
              title={verCompleta ? 'Ocultar nota' : 'Ver nota completa'}
              className={`${botonIconoCardClase} hover:bg-brand-cream`}
            >
              {verCompleta ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            <button
              type="button"
              ref={botonRef}
              onClick={abrir}
              aria-label="Editar la nota para la cocina"
              title="Editar nota"
              className={`${botonIconoCardClase} hover:bg-brand-cream`}
            >
              <Pencil className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={quitar}
              aria-label="Eliminar la nota para la cocina"
              title="Eliminar nota"
              className={`${botonIconoCardClase} hover:bg-brand-red/10 hover:text-brand-red`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 3. MODO INICIAL (SIN NOTA)
  return (
    <button type="button" ref={botonRef} onClick={abrir} className={botonAgregarNotaClase}>
      <span className="flex min-w-0 items-center gap-2">
        <StickyNote className="h-4 w-4 shrink-0 text-brand-red" />
        <span className="truncate">Agregar nota para la cocina</span>
      </span>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-brand-dark bg-brand-cream text-brand-dark">
        <Plus className="h-4 w-4" />
      </span>
    </button>
  )
}
