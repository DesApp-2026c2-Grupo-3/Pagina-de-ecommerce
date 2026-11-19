import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface SeccionDesplegableProps {
  /** Identifica la sección para recordar si quedó abierta o cerrada (durante la sesión) */
  id: string
  titulo: string
  descripcion?: string
  /** Lo que se ve siempre, plegada o abierta: la vista previa */
  vistaPrevia?: ReactNode
  /** Una línea de resumen para cuando está plegada y no hay vista previa */
  resumen?: string
  abiertaPorDefecto?: boolean
  /** Las opciones de edición: solo se ven con la sección abierta */
  children: ReactNode
}

const clave = (id: string) => `seccion-abierta:${id}`

function leer(id: string, porDefecto: boolean) {
  try {
    const guardado = sessionStorage.getItem(clave(id))
    return guardado === null ? porDefecto : guardado === '1'
  } catch {
    return porDefecto
  }
}

// Panel que se pliega para ocupar poco lugar: plegado deja a la vista la vista previa (o el resumen)
// y un botón para abrir las opciones de edición.
export default function SeccionDesplegable({
  id,
  titulo,
  descripcion,
  vistaPrevia,
  resumen,
  abiertaPorDefecto = false,
  children,
}: SeccionDesplegableProps) {
  const [abierta, setAbierta] = useState(() => leer(id, abiertaPorDefecto))

  useEffect(() => {
    try {
      sessionStorage.setItem(clave(id), abierta ? '1' : '0')
    } catch {
      // Sin almacenamiento: simplemente no se recuerda
    }
  }, [id, abierta])

  const idContenido = `contenido-${id}`

  return (
    <section className="mb-6 rounded-lg border bg-white">
      <header className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-gray-600">{descripcion}</p>}
          {!abierta && !vistaPrevia && resumen && <p className="mt-1 text-sm text-gray-500">{resumen}</p>}
        </div>

        <button
          type="button"
          onClick={() => setAbierta((a) => !a)}
          aria-expanded={abierta}
          aria-controls={idContenido}
          className="inline-flex shrink-0 items-center gap-1 rounded border px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-gray-50"
        >
          {abierta ? 'Plegar' : 'Editar'}
          <ChevronDown size={16} className={`transition-transform ${abierta ? 'rotate-180' : ''}`} />
        </button>
      </header>

      {vistaPrevia && <div className="px-4 pb-4">{vistaPrevia}</div>}

      {abierta && (
        <div id={idContenido} className="border-t p-4">
          {children}
        </div>
      )}
    </section>
  )
}
