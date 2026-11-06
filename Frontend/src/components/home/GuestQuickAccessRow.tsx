import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'

// Invitación a registrarse (solo para visitantes sin sesión). Mismo formato que la tarjeta de último pedido.
function GuestQuickAccessRow() {
  return (
    /* 
      Margen dinámico idéntico a UltimoPedidoCard: 
      -mt-6 en mobile, sm:-mt-8 y md:-mt-12 para calzar exacto sobre el Hero.
    */
    <section className="relative z-10 -mt-6 sm:-mt-8 md:-mt-12 px-4 pb-6 md:pb-10">
      
      {/* Contenedor principal horizontal elástico */}
      <div className="mx-auto flex flex-row items-center gap-2 md:gap-6 rounded-[1.75rem] border-2 border-brand-dark bg-white px-3 py-3 md:p-6 shadow-sticker max-w-7xl">
        
        {/* 
          🌟 ÍCONO SIEMPRE VISIBLE CON SU COLOR ORIGINAL:
          - bg-brand-mustard: Mantiene tu fondo amarillo original intacto.
          - h-10 w-10: Tamaño compacto y esbelto en mobile para no estirar la fila.
          - md:h-14 md:w-14: Recupera su tamaño original grande en PC.
        */}
        <span className="grid h-10 w-10 md:h-14 md:w-14 shrink-0 place-items-center rounded-2xl bg-brand-mustard border md:border-2 border-brand-dark shadow-sm">
          <UserPlus className="h-5 w-5 md:h-7 md:w-7 text-brand-dark" />
        </span>

        {/* Textos informativos que fluyen en el centro de la fila */}
        <div className="min-w-0 flex-1">
          {/* Tag de categoría superior exclusivo de mobile */}
          <p className="block md:hidden text-[10px] font-bold uppercase tracking-wider text-brand-muted truncate">
            ¡Registrate gratis!
          </p>

          <p className="hidden md:block text-xs font-bold uppercase tracking-wider text-brand-muted">
            Creá tu cuenta
          </p>
          
          {/* Título de la propuesta: Adaptable y con warp natural en tablets */}
          <p className="font-display text-xs sm:text-xs min-[640px]:max-[860px]:text-sm md:text-2xl font-extrabold leading-tight text-brand-dark truncate md:whitespace-normal mt-0.5 md:mt-0">
            Pedí más fácil y seguí tu delivery
          </p>

          {/* Breve descripción visible únicamente en computadoras para no inflar el alto en celulares */}
          <p className="hidden md:block mt-1 text-sm text-brand-muted">
            Guardá tus direcciones, seguí tus pedidos y repetilos con un toque.
          </p>
        </div>

        {/* 
          Botón Ultra-Adaptable a la derecha:
          - Limitamos el ancho máximo en pantallas chicas y forzamos el !font-bold.
        */}
        <div className="shrink-0 max-w-[125px] sm:max-w-[145px] md:max-w-none text-xs md:text-base [&_a]:inline-flex [&_a]:min-h-[2.25rem] md:[&_a]:min-h-12 [&_a]:items-center [&_a]:justify-center [&_a]:rounded-full [&_a]:bg-brand-red [&_a]:px-3 md:[&_a]:px-6 [&_a]:!font-bold [&_a]:text-white [&_a]:whitespace-nowrap [&_a]:transition-transform [&_a]:hover:translate-y-0.5">
          <Link to="/registro">
            Registrarme
          </Link>
        </div>

      </div>
    </section>
  )
}

export default GuestQuickAccessRow
