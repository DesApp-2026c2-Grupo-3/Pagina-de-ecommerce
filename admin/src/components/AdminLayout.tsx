import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import NavBar from './NavBar'
import Footer from './Footer'
import { hayModalAbierto, suscribirModales } from '../hooks/useBloquearScroll'

// D-23: entre tablet y escritorio chico el menú expandido (256 px) no deja lugar al modal y
// quedan superpuestos. Ahí, al abrirse un modal el menú se contrae, y se vuelve a expandir
// al cerrarlo. En pantallas más anchas sobra lugar y no se toca.
const SIN_LUGAR_PARA_MODAL = '(min-width: 48rem) and (max-width: 79.99rem)'

export default function AdminLayout() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const abierto = useRef(menuAbierto)
  const contraidoPorModal = useRef(false)

  useEffect(() => {
    abierto.current = menuAbierto
  }, [menuAbierto])

  useEffect(
    () =>
      suscribirModales(() => {
        if (hayModalAbierto()) {
          if (abierto.current && window.matchMedia(SIN_LUGAR_PARA_MODAL).matches) {
            contraidoPorModal.current = true
            setMenuAbierto(false)
          }
        } else if (contraidoPorModal.current) {
          contraidoPorModal.current = false
          setMenuAbierto(true)
        }
      }),
    [],
  )

  return (
    <div className="flex min-h-screen flex-col">
      <div className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${
        menuAbierto ? 'md:ml-64' : 'md:ml-20'}`}>
        <NavBar
          menuAbierto={menuAbierto}
          setMenuAbierto={setMenuAbierto}
        />

        <div className="flex min-w-0 flex-1 flex-col">

          <main className="flex-1">
            <Outlet />
          </main>
          
          <Footer />
        </div>
      </div>

      
    </div>
  )
}
