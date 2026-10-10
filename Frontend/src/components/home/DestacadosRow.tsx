import { Link } from 'react-router-dom'
import { DESTACADOS, type Destacado } from '../../config/home'

const FONDO_RECUADRO: Record<Destacado['acento'], string> = {
  red: 'bg-brand-red',
  mustard: 'bg-brand-mustard',
  dark: 'bg-brand-dark',
}

// Imagen sobre un recuadro inclinado, con sticker abajo y badge en la esquina (el estilo del carrusel anterior).
// Con "invertido" se espeja: el recuadro se inclina al revés, el sticker va a la derecha y el badge a la izquierda.
function DestacadoCard({ destacado }: { destacado: Destacado }) {
  const inv = destacado.invertido

  return (
    <Link to={destacado.link} className="group relative mx-auto block w-full max-w-xs pb-6 pt-3">
      <div
        className={`relative grid aspect-square place-items-center rounded-[2.5rem] border-2 border-brand-dark transition-transform group-hover:rotate-0 ${
          inv ? '-rotate-3' : 'rotate-3'
        } ${FONDO_RECUADRO[destacado.acento]}`}
      >
        <div className="absolute inset-[7%] rounded-full bg-black/15" />
        <img
          src={destacado.imagen}
          alt=""
          className={`relative w-[85%] object-contain drop-shadow-2xl transition-transform group-hover:scale-105 ${
            inv ? 'rotate-3' : '-rotate-3'
          }`}
        />
      </div>

      <div
        className={`absolute bottom-0 rounded-2xl border-2 border-brand-dark bg-brand-cream px-4 py-3 text-brand-dark shadow-sticker ${
          inv ? '-right-2 rotate-6' : '-left-2 -rotate-6'
        }`}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">{destacado.sticker.eyebrow}</p>
        <p className="font-display text-xl font-extrabold leading-tight">{destacado.sticker.titulo}</p>
      </div>

      {destacado.badge && (
        <div
          className={`absolute top-0 grid h-20 w-20 place-items-center rounded-full border-[3px] border-brand-dark bg-brand-mustard p-2 text-center font-display text-sm font-extrabold leading-none text-brand-dark ${
            inv ? '-left-2 -rotate-12' : '-right-2 rotate-12'
          }`}
        >
          {destacado.badge}
        </div>
      )}
    </Link>
  )
}

function DestacadosRow() {
  return (
    <section className="px-4 pb-16">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {DESTACADOS.map((d) => (
          <DestacadoCard key={d.id} destacado={d} />
        ))}
      </div>
    </section>
  )
}

export default DestacadosRow