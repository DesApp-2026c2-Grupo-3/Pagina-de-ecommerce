import { useZona } from '../../context/ZonaContext'
import Aviso from '../ui/Aviso'

interface Props {
  sucursal?: string
  motivo?: string | null
  className?: string
}

function AvisoCierreSucursal({ sucursal, motivo, className }: Props) {
  const { abrirSelector } = useZona()
  const mensaje = `${motivo ? `${motivo}. ` : 'Está fuera del horario de atención. '}No se pueden generar pedidos por ahora.`

  return (
    <Aviso
      variante="error"
      titulo={`${sucursal ?? 'La sucursal'} está cerrada ahora`}
      mensaje={mensaje}
      className={className}
    >
      <button
        type="button"
        onClick={abrirSelector}
        className="mt-3 rounded-full bg-brand-dark px-4 py-2 font-bold text-brand-cream transition-transform hover:translate-y-0.5"
      >
        Cambiar dirección
      </button>
    </Aviso>
  )
}

export default AvisoCierreSucursal
