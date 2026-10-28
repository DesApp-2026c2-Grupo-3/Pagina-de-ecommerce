import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      // Link a una sección (ej: /conocenos#sucursales): se espera a que la página pinte y se baja hasta ella.
      // El margen superior de cada sección (scroll-mt) deja lugar al navbar fijo.
      const id = decodeURIComponent(hash.slice(1))
      const timer = window.setTimeout(() => {
        const destino = document.getElementById(id)
        if (destino) destino.scrollIntoView({ behavior: 'smooth', block: 'start' })
        else window.scrollTo(0, 0)
      }, 50)
      return () => window.clearTimeout(timer)
    }
    window.scrollTo(0, 0)
  }, [pathname, hash])

  return null
}