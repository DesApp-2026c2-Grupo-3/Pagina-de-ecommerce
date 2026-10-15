import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

// A partir de cuántos píxeles scrolleados aparece el botón
const APARECE_DESDE_PX = 400

// Botón flotante para volver arriba (reemplaza a la barra de scroll, que está oculta)
function BotonSubir() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function alScrollear() {
      setVisible(window.scrollY > APARECE_DESDE_PX)
    }
    alScrollear()
    window.addEventListener('scroll', alScrollear, { passive: true })
    return () => window.removeEventListener('scroll', alScrollear)
  }, [])

  return (
    <button
      type="button"
      aria-label="Volver arriba"
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-28 right-4 z-30 grid h-12 w-12 place-items-center rounded-full border-2 border-brand-dark bg-brand-red text-white shadow-[4px_4px_0_var(--color-brand-dark)] transition-all duration-300 hover:-translate-y-1 lg:bottom-8 lg:right-8 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <ArrowUp className="h-6 w-6" strokeWidth={2.6} />
    </button>
  )
}

export default BotonSubir