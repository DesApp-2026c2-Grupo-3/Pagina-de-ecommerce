import { Bell } from 'lucide-react'

import BotonIcono from '../ui/BotonIcono'
import Insignia from '../ui/Insignia'
import { etiquetaAvisos } from '../../utils/etiquetaAvisos'

interface CampanaNotificacionesProps {
  id: string
  noLeidas: number | null
  abierta: boolean
  idPanel: string
  onAlternar: () => void
}

// Campana del encabezado de escritorio (en el celular es la pestaña "Avisos" de la barra inferior)
export default function CampanaNotificaciones({ id, noLeidas, abierta, idPanel, onAlternar }: CampanaNotificacionesProps) {
  return (
    <BotonIcono
      id={id}
      icono={Bell}
      etiqueta={etiquetaAvisos(noLeidas)}
      tono="marca"
      aria-expanded={abierta}
      aria-controls={idPanel}
      onClick={onAlternar}
    >
      <Insignia cantidad={noLeidas} flotante />
    </BotonIcono>
  )
}
