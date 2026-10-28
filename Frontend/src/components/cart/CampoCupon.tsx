import { useState, type FormEvent } from 'react'
import { TicketPercent } from 'lucide-react'
import { CUPONES_HABILITADOS } from '../../config/compra'

// Campo para ingresar un cupón. Mientras no haya backend, solo avisa que todavía no está disponible.
function CampoCupon() {
  const [codigo, setCodigo] = useState('')
  const [mensaje, setMensaje] = useState('')

  function aplicar(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim()) return
    // TODO backend: validar el cupón contra la API y devolver el descuento
    setMensaje(CUPONES_HABILITADOS ? '' : 'Los cupones todavía no están disponibles.')
  }

  return (
    <form onSubmit={aplicar} className="flex flex-col gap-2">
      <label htmlFor="cupon" className="flex items-center gap-2 text-sm font-bold">
        <TicketPercent className="h-4 w-4 text-brand-red" /> ¿Tenés un cupón?
      </label>
      <div className="flex gap-2">
        <input
          id="cupon"
          type="text"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value.toUpperCase())
            setMensaje('')
          }}
          placeholder="Código"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-2xl border-2 border-brand-dark/15 bg-white px-4 py-2.5 text-sm font-bold uppercase tracking-wider placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:border-brand-red focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded-2xl border-2 border-brand-dark bg-brand-cream px-4 text-sm font-bold transition-colors hover:bg-brand-mustard"
        >
          Aplicar
        </button>
      </div>
      {mensaje && <p className="text-xs font-bold text-brand-muted">{mensaje}</p>}
    </form>
  )
}

export default CampoCupon