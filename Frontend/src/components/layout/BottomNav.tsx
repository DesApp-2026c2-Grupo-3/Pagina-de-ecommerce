import { NavLink, useLocation } from 'react-router-dom'
import { BadgePercent, House, ShoppingBag, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

interface Tab {
  label: string
  to: string
  Icono: LucideIcon
}

function TabLink({ label, to, Icono }: Tab) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      aria-label={label}
      className={({ isActive }) =>
        `flex h-16 flex-col items-center justify-center gap-1 ${isActive ? 'text-brand-mustard' : 'text-white/60'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icono className="h-6 w-6" strokeWidth={isActive ? 2.6 : 2} />
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-brand-mustard' : 'bg-transparent'}`} />
        </>
      )}
    </NavLink>
  )
}

// Barra de navegación inferior (solo celular y tablet)
function BottomNav() {
  const { isAuthenticated } = useAuth()
  const { totalItems } = useCart()
    const { pathname } = useLocation()

  // En la ficha de producto, abajo va la barra de compra
  if (pathname.startsWith('/producto/')) return null

  const izquierda: Tab[] = [
    { label: 'Inicio', to: '/', Icono: House },
    { label: 'Menú', to: '/catalogo', Icono: UtensilsCrossed },
  ]
  const derecha: Tab[] = [
    { label: 'Promos', to: '/promociones', Icono: BadgePercent },
    { label: isAuthenticated ? 'Mi cuenta' : 'Ingresar', to: isAuthenticated ? '/cuenta' : '/login', Icono: UserRound },
  ]

  return (
    <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-center rounded-full border-2 border-white/10 bg-brand-dark shadow-[0_10px_30px_rgba(26,20,20,0.45)]">
        {izquierda.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}

        {/* El carrito, al centro y elevado */}
        <NavLink
          to="/carrito"
          aria-label={`Carrito, ${totalItems} productos`}
          className="relative -mt-8 grid h-[4.25rem] w-[4.25rem] -rotate-6 place-items-center justify-self-center rounded-full border-4 border-brand-cream bg-brand-red text-white shadow-lg ring-2 ring-brand-dark transition-transform active:scale-95"
        >
          <ShoppingBag className="h-7 w-7" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-brand-dark bg-brand-mustard px-1 text-xs font-extrabold text-brand-dark">
              {totalItems}
            </span>
          )}
        </NavLink>

        {derecha.map((tab) => (
          <TabLink key={tab.to} {...tab} />
        ))}
      </div>
    </nav>
  )
}

export default BottomNav