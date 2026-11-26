import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useAgregarPromo, useCatalogo, usePromociones } from '../../hooks/usePromociones'
import { resolverPromo } from '../../utils/promosUtils'
import PromoBanner from '../promos/PromoBanner'
import type { Promo } from '../../types/promo'
import { ArrowBigLeft, ArrowBigRight } from 'lucide-react'

const CADA_MS = 6000

const STYLES = {
  section: 'px-4 pb-14',
  container: 'mx-auto max-w-7xl',
  title: 'py-6 font-display text-2xl font-extrabold tracking-tight md:text-4xl',
  slidesStack: 'relative grid [&>*]:col-start-1 [&>*]:row-start-1',
  arrowBtn:
    'absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-black/20 p-2 text-white transition-colors hover:bg-black/40 md:block',
  dotsRow: 'mt-2 flex justify-center',
  // Área táctil de 24 × 24 px alrededor del puntito (Lighthouse, tamaño de objetivos táctiles)
  dotTarget: 'group grid h-6 min-w-6 place-items-center',
  dotBase: 'h-2 rounded-full transition-all',
  dotActive: 'w-6 bg-brand-red',
  dotInactive: 'w-2 bg-brand-dark/25 group-hover:bg-brand-dark/40',
} as const

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

  return (
    <section
      className={STYLES.section}
      aria-roledescription="carrusel"
      aria-label={`Promos de hoy, ${hoy.nombre.toLowerCase()}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className={STYLES.container}>
        <h2 className={STYLES.title}>
          Las promos <span className="text-brand-red">de hoy</span>        
          </h2>

        <div className={STYLES.slidesStack}>
          {lista.map((p, i) => (
            <div key={p.id} aria-hidden={i !== visible} className={`grid ${i === visible ? '' : 'invisible'}`}>
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
              <button
                type="button"
                onClick={() => mover(-1)}
                aria-label="Promo anterior"
                className={`${STYLES.arrowBtn} left-3`}
              >
                <ArrowBigLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => mover(1)}
                aria-label="Promo siguiente"
                className={`${STYLES.arrowBtn} right-3`}
              >
                <ArrowBigRight size={18} />
              </button>
            </>
          )}
        </div>

        {lista.length > 1 && (
          <div className={STYLES.dotsRow}>
            {lista.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActual(i)}
                aria-label={`Ver promo ${i + 1}: ${p.titulo}`}
                aria-current={i === visible ? 'true' : undefined}
                className={STYLES.dotTarget}
              >
                <span className={`${STYLES.dotBase} ${i === visible ? STYLES.dotActive : STYLES.dotInactive}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default PromoDestacadaBanner
