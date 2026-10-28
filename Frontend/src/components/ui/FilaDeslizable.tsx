import { useEffect, useRef, useState } from 'react'
import type { ReactNode, UIEvent } from 'react'
import { Pointer } from 'lucide-react'
import { useDragScroll } from '../../hooks/useDragScroll'

// Función auxiliar para construir la clave dinámica basada en el usuario
const obtenerClave = (userId?: string) => `pista-deslizar-vista:${userId ?? 'invitado'}`

const DISTANCIA_MINIMA_PX = 40
const VENTANA_GESTO_MS = 4000

function yaAprendio(userId?: string): boolean {
  try {
    return window.localStorage.getItem(obtenerClave(userId)) === '1'
  } catch {
    return false
  }
}

function recordarAprendido(userId?: string) {
  try {
    window.localStorage.setItem(obtenerClave(userId), '1')
  } catch {
    // Sin localStorage la pista simplemente vuelve a aparecer en la próxima visita
  }
}

interface Props {
  className?: string
  children: ReactNode
  userId?: string // 👈 Agregamos el ID del usuario actual como Prop
}

function FilaDeslizable({ className = '', children, userId }: Props) {
  const { ref, handlers } = useDragScroll<HTMLDivElement>()
  const [desborda, setDesborda] = useState(false)
  
  // 👈 Inicializamos el estado basado en el userId actual
  const [aprendio, setAprendio] = useState(() => yaAprendio(userId))
  
  const gesto = useRef<{ x: number; t: number } | null>(null)

  // 👈 Efecto clave: Si el userId cambia (ej. al cerrar sesión o cambiar de cuenta), 
  // recalculamos si este nuevo usuario ya aprendió el gesto.
  useEffect(() => {
    setAprendio(yaAprendio(userId))
  }, [userId])

  useEffect(() => {
    const fila = ref.current
    if (!fila || typeof ResizeObserver === 'undefined' || typeof MutationObserver === 'undefined') return

    const medir = () => setDesborda(fila.scrollWidth > fila.clientWidth + 1)

    const porTamanio = new ResizeObserver(medir)
    const porContenido = new MutationObserver(medir)
    porTamanio.observe(fila)
    porContenido.observe(fila, { childList: true })

    return () => {
      porTamanio.disconnect()
      porContenido.disconnect()
    }
  }, [ref])

  const iniciarGesto = (forzar: boolean) => {
    const fila = ref.current
    if (!fila) return
    const ahora = Date.now()
    if (forzar || !gesto.current || ahora - gesto.current.t > VENTANA_GESTO_MS) {
      gesto.current = { x: fila.scrollLeft, t: ahora }
    }
  }

  const alDeslizar = (evento: UIEvent<HTMLDivElement>) => {
    const inicio = gesto.current
    if (aprendio || !inicio || Date.now() - inicio.t > VENTANA_GESTO_MS) return
    if (Math.abs(evento.currentTarget.scrollLeft - inicio.x) < DISTANCIA_MINIMA_PX) return
    
    recordarAprendido(userId) // 👈 Guardamos el aprendizaje asociado al usuario actual
    setAprendio(true)
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        onScroll={alDeslizar}
        onPointerDown={() => iniciarGesto(true)}
        onWheel={() => iniciarGesto(false)}
        {...(desborda ? { onMouseDown: handlers.onMouseDown, onClickCapture: handlers.onClickCapture } : {})}
        className={`${className} ${desborda ? handlers.className : ''}`}
      >
        {children}
      </div>

      {desborda && !aprendio && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-8 flex items-center">
          <span className="pista-deslizar">
            <Pointer className="h-9 w-9 fill-white text-brand-dark drop-shadow-md" />
          </span>
        </span>
      )}
    </div>
  )
}

export default FilaDeslizable
