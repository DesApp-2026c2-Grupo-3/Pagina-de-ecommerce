import { useId, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotificaciones } from '../../context/notificaciones/NotificacionContext'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useAnclajeDebajo } from '../../hooks/useAnclajeDebajo'
import { CONSULTA_CELULAR } from '../../config/pantallas'
import BandejaNotificaciones from './BandejaNotificaciones'

interface Props {
  className?: string
}

// Botón de la campana con el contador; abre y cierra la bandeja
function CampanaNotificaciones({ className = '' }: Props) {
  const { noLeidas } = useNotificaciones()
  const [abierto, setAbierto] = useState(false)
  const esCelular = useMediaQuery(CONSULTA_CELULAR)
  const botonRef = useRef<HTMLButtonElement>(null)
  const idPanel = useId()
  const { anclaje, medir } = useAnclajeDebajo(botonRef, abierto && !esCelular)

  function abrirPanel() {
    medir()
    setAbierto(true)
  }

  const cerrarPanel = () => setAbierto(false)

  return (
    <div className={className}>
      <button
        ref={botonRef}
        type="button"
        onClick={() => (abierto ? cerrarPanel() : abrirPanel())}
        aria-label={noLeidas === null ? 'Notificaciones' : `Notificaciones, ${noLeidas} sin leer`}
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-haspopup="dialog"
        className={`relative grid h-11 w-11 place-items-center rounded-2xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-brand-dark ${
          abierto
            ? 'border-brand-cream bg-brand-cream text-brand-dark'
            : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
        }`}
      >
        <Bell className="h-6 w-6" />
        {noLeidas !== null && noLeidas > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark"
          >
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      <BandejaNotificaciones
        id={idPanel}
        abierto={abierto}
        esCelular={esCelular}
        anclaje={anclaje}
        onCerrar={cerrarPanel}
      />
    </div>
  )
}

export default CampanaNotificaciones
