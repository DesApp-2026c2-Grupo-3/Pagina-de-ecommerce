import type { Sucursal } from '../../types/sucursal'
import BranchMap from './BranchMap'

interface BranchCardProps {
  sucursal: Sucursal
}

function BranchCard({ sucursal }: BranchCardProps) {
  const direccion = [sucursal.calle, sucursal.numero].filter(Boolean).join(' ')

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white shadow-sm">
      <BranchMap
        nombre={sucursal.nombre}
        latitud={sucursal.latitud}
        longitud={sucursal.longitud}
      />
      <div className="p-5">
        <h3 className="text-lg font-extrabold text-brand-dark">{sucursal.nombre}</h3>
        <p className="mt-1 text-sm text-gray-600">
          {direccion}, {sucursal.localidad}
        </p>
        {sucursal.telefono && (
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span aria-hidden="true">📞</span>
            {sucursal.telefono}
          </p>
        )}
        {sucursal.horario && (
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <span aria-hidden="true">🕒</span>
            {sucursal.horario}
          </p>
        )}
      </div>
    </div>
  )
}

export default BranchCard
