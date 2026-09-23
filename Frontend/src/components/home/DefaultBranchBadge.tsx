import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getSucursales } from '../../services/sucursalService'
import { actualizarSucursalPredeterminada } from '../../services/userService'
import type { Sucursal } from '../../types/sucursal'

function DefaultBranchBadge() {
  const { user, setUser } = useAuth()
  const [open, setOpen] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [saving, setSaving] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && sucursales.length === 0) {
      getSucursales().then(setSucursales)
    }
  }, [open, sucursales.length])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSelect(sucursalId: number) {
    if (!user) return
    setSaving(true)
    try {
      const updated = await actualizarSucursalPredeterminada(user.id, sucursalId)
      setUser(updated)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const label = user?.sucursal
    ? `📍 Comprás desde ${user.sucursal.nombre.replace('BurgerFast ', '')}`
    : '📍 Elegir una sucursal predeterminada'

  return (
    <div ref={wrapperRef} className="relative mx-auto max-w-7xl px-4 pt-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full bg-gray-200 px-5 py-2 text-sm font-bold text-brand-dark transition-colors hover:bg-gray-300"
      >
        {label}
      </button>

      {open && (
        <div className="absolute left-4 z-20 mt-2 w-72 rounded-xl border border-brand-dark/10 bg-white p-2 shadow-lg">
          {sucursales.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500">Cargando sucursales...</p>
          ) : (
            sucursales.map((sucursal) => (
              <button
                key={sucursal.id}
                type="button"
                disabled={saving}
                onClick={() => handleSelect(sucursal.id)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-brand-dark transition-colors hover:bg-brand-cream disabled:opacity-50"
              >
                <span className="font-semibold">{sucursal.nombre.replace('BurgerFast ', '')}</span>
                <span className="block text-xs text-gray-500">{sucursal.localidad}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default DefaultBranchBadge
