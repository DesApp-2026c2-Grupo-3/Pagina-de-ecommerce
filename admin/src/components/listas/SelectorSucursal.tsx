import type { ChangeEvent } from 'react'
import type { SucursalOpcion } from '../../types/pedido.types'

// Selector de sucursal: solo lo ve el MASTER (RN-35)
export default function SelectorSucursal({
  sucursales,
  sucursalId,
  onChange,
  className = '',
}: {
  sucursales: SucursalOpcion[]
  sucursalId: number | null
  onChange: (id: number) => void
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor="filtro-sucursal" className="sr-only">
        Elegir sucursal
      </label>
      <select
        id="filtro-sucursal"
        value={sucursalId !== null ? String(sucursalId) : ''}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(Number(e.target.value))}
        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3"
      >
        {sucursales.map((s) => (
          <option key={s.id} value={String(s.id)}>
            {s.activa ? s.nombre : `${s.nombre} (inactiva)`}
          </option>
        ))}
      </select>
    </div>
  )
}
