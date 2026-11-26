import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'
import { hayModalAbierto, suscribirModales } from '../hooks/useBloquearScroll'

// Plan del menú lateral v1: en escritorio el menú abierto FLOTA encima del contenido.
// El contenido siempre deja lugar solo para el riel de íconos (80 px) y no cambia de ancho.
// En móvil el menú es otro (NavBar) y no cambia.
export default function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const abierto = useRef(menuAbierto)
  const { pathname } = useLocation()

  useEffect(() => {
    abierto.current = menuAbierto
  }, [menuAbierto])

  // D-M2: al cambiar de página, el menú se cierra (reinicio en el render, no en un efecto)
  const [rutaMostrada, setRutaMostrada] = useState(pathname)
  if (rutaMostrada !== pathname) {
    setRutaMostrada(pathname)
    setMenuAbierto(false)
  }

  // D-M3 (reemplaza D-23): al abrirse un modal, el menú se cierra en cualquier ancho
  useEffect(
    () =>
      suscribirModales(() => {
        if (hayModalAbierto() && abierto.current) setMenuAbierto(false)
      }),
    [],
  )

  // Escape cierra el menú, solo mientras está abierto
  useEffect(() => {
    if (!menuAbierto) return
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setMenuAbierto(false)
    }
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [menuAbierto])

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex min-w-0 flex-1 flex-col md:ml-20">
        <NavBar menuAbierto={menuAbierto} setMenuAbierto={setMenuAbierto} />

        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1">
            <Outlet />
          </main>

          <Footer />
        </div>
      </div>

      {/* D-M1: fondo apenas oscurecido detrás del menú abierto (por debajo del menú, z-30).
          Un clic lo cierra. Fuera del orden de Tab: ya están el botón ‹ y la tecla Escape. */}
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          tabIndex={-1}
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-20 hidden cursor-default bg-black/15 md:block"
        />
      )}
    </div>
  )
}
