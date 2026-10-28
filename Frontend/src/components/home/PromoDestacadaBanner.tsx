import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useAgregarPromo, useCatalogo, usePromociones } from '../../hooks/usePromociones'
import { resolverPromo } from '../../utils/promosUtils'
import PromoBanner from '../promos/PromoBanner'
import type { Promo } from '../../types/promo'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'

const CADA_MS = 6000

// Carrusel con las 3 promos de HOY: cambia solo cada 6 s y se mueve con los puntitos (como el carrusel de arriba).
// Las 3 se dibujan una encima de la otra en la misma celda, así el alto es siempre el de la más alta y no salta.
function PromoDestacadaBanner() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const promos = usePromociones()
  const { catalogo, cargando } = useCatalogo()
  const agregar = useAgregarPromo(catalogo)
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)

  const hoy = promos?.dias.find((d) => d.dia === promos.hoy)
  const lista = hoy?.promos ?? []

  useEffect(() => {
    if (pausado || lista.length < 2) return
    const id = setInterval(() => setActual((i) => (i + 1) % lista.length), CADA_MS)
    return () => clearInterval(id)
  }, [pausado, lista.length])

  if (!hoy || lista.length === 0) return null
  const visible = actual % lista.length

  function pedir(p: Promo) {
    const error = agregar(p)
    if (error) {
      showToast(error)
      return
    }
    showToast(`"${p.titulo}" se sumó a tu carrito`)
    navigate('/carrito')
  }
  const mover = (paso: number) => setActual((i) => (i + paso + lista.length) % lista.length)
  const flecha =
    'absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40 md:block'

  return (
    <section
      className="px-4 pb-14"
      aria-roledescription="carrusel"
      aria-label={`Promos de hoy, ${hoy.nombre.toLowerCase()}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative grid [&>*]:col-start-1 [&>*]:row-start-1">          {lista.map((p, i) => (
            <div
              key={p.id}
              aria-hidden={i !== visible}
              className={`grid ${i === visible ? '' : 'invisible'}`}
            >
              <PromoBanner
                promo={p}
                resuelta={resolverPromo(p, catalogo)}
                etiqueta={`Hoy · ${hoy.nombre}`}
                cargando={cargando}
                onPedir={() => pedir(p)}
              />
            </div>
          ))}
            {lista.length > 1 && (
            <>
              <button type="button" onClick={() => mover(-1)} aria-label="Promo anterior" className={`${flecha} left-3`}>
                <ArrowBigLeft size={18} />
              </button>
              <button type="button" onClick={() => mover(1)} aria-label="Promo siguiente" className={`${flecha} right-3`}>
                <ArrowBigRight size={18} />
              </button>
            </>
          )}
        </div>

        {lista.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {lista.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver promo ${i + 1}: ${p.titulo}`}
                aria-current={i === visible ? 'true' : undefined}
                className={`h-2 rounded-full ${i === visible ? 'w-6 bg-brand-red' : 'w-2 bg-brand-dark/25 hover:bg-brand-dark/40'}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PromoDestacadaBanner
