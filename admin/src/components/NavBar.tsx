import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShoppingBag, Package,
   Store, ChartNoAxesCombined, ChevronLeft, ChevronRight,Users, Wheat,
    Tags, Hamburger, Bike, type LucideIcon,} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { cerrarSesionService } from '../services/authService'
import { enlacesDe } from '../config/menu'

interface NavBarProps {
  menuAbierto: boolean
  setMenuAbierto: (abierto: boolean) => void
}

const iconosPorEnlace: Record<string, LucideIcon> = {
  Inicio: LayoutDashboard,
  Pedidos: ShoppingBag,
  Productos: Package,
  Sucursales: Store,
  Reportes: ChartNoAxesCombined,
  Insumos: Wheat,
  Categorías: Tags,
  Administradores: Users,
  Stock: Package,
  Repartidores: Bike
}


export default function Navbar({ menuAbierto, setMenuAbierto } : NavBarProps) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const navigate = useNavigate()
  const { administrador, cerrarSesion } = useAuth()

  const enlaces = enlacesDe(administrador)

  const mostrarTexto = menuAbierto || menuMovilAbierto

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    const ajustarMenu = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setMenuMovilAbierto(false)
      }
    }

    mediaQuery.addEventListener('change', ajustarMenu)

    return () => {
      mediaQuery.removeEventListener('change', ajustarMenu)
    }
  }, [])

  const rolTexto =
    administrador?.rol === 'MASTER'
      ? 'Administrador general'
      : `Sucursal ${administrador?.sucursal?.nombre ?? 'sin asignar'}`

  const salir = async () => {
    try {
      await cerrarSesionService()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
    cerrarSesion()
    navigate('/')
  }

  const contenidoMenu = (
    <div className=''>
    <div className="flex shrink-0 items-center justify-center gap-2 px-3 py-5">
      <div className="flex min-w-0 items-center gap-3">
        <Hamburger size={36} className="shrink-0 text-orange-400" />

        {mostrarTexto && (
          <div className="min-w-0">
            <p className="font-bold">Administración</p>
            <p className="text-xs text-gray-400">Panel de gestión</p>
          </div>
        )}
      </div>

      <button type="button" onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label={menuAbierto ? 'Contraer menú' : 'Expandir menú'}
        aria-expanded={menuAbierto}
        title={menuAbierto ? 'Contraer menú' : 'Expandir menú'}
        className={`fixed top-1/2 z-30 hidden h-16 w-7 -translate-y-1/2 items-center justify-center rounded-r-xl border 
         border-orange-500 bg-gray-900 text-white shadow-lg transition-[left,width] duration-200 hover:w-9 md:flex ${
        menuAbierto ? 'left-64' : 'left-20'}`}
        >
    
      {mostrarTexto ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      
      </button>
    </div>

    <nav className="flex min-h-0 flex-1 flex-col space-y-2
                overflow-y-auto p-3
                [scrollbar-width:none]
                [&::-webkit-scrollbar]:hidden
                ">
      {enlaces.map((enlace) => {
        const Icono = iconosPorEnlace[enlace.label] ?? Store

        return (
        <NavLink key={enlace.to} to={enlace.to} end={enlace.end}
          title={!menuAbierto ? enlace.label : undefined}
          onClick={() => setMenuMovilAbierto(false)}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
              isActive ? 'bg-orange-500/15 font-semibold text-orange-400' : 'text-gray-300 hover:bg-gray-800 hover:text-white' }`}>
        
          <Icono size={20} className="shrink-0" />
            {mostrarTexto && <span>{enlace.label}</span>}
        </NavLink>
        )
      })}
      </nav>

      <div className="border-t border-gray-700 p-3">
        <div className={`flex items-center gap-2 ${menuAbierto ? '' : 'flex-col'}`}>
          <div className={`flex min-w-0 flex-1 items-center gap-3 ${
            menuAbierto ? '' : 'justify-center'}`}
              title={ !menuAbierto ? `${administrador?.nombre ?? ''} - ${rolTexto}` : undefined }>
            
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-700 font-semibold">
              {administrador?.nombre?.charAt(0).toUpperCase() ?? 'A'}
            </div>

            {menuAbierto && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {administrador?.nombre}
                </p>
                
                <p className="truncate text-xs text-gray-400">
                  {rolTexto}
                </p>
              </div>)
            }
          </div>

          <button type="button" onClick={salir}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-300 hover:bg-red-500/15 hover:text-red-400">
            <LogOut size={20} />
          </button>
  
        </div>
      </div>
    
    </div>
  )

  return (
    <>
    {/* Menú lateral de escritorio */}
    <aside className={`fixed inset-y-0 left-0 z-30 hidden border-r-4 border-orange-500
      flex-col bg-gray-900 text-white
      transition-[width] duration-200 md:flex ${
      menuAbierto ? 'w-64' : 'w-20' }`}>
        {contenidoMenu}
    </aside>
    
    {/* Botón y panel lateral para celular */}
    <div className="md:hidden">
      <button type="button" onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
        aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuMovilAbierto}
        className={`fixed top-1/2 z-[60] flex h-16 w-7 -translate-y-1/2 items-center justify-center
          border border-orange-500 bg-gray-900 text-white shadow-lg
          transition-[left] duration-200 md:hidden
          ${ menuMovilAbierto ? 'left-72 rounded-r-xl' : 'left-0 rounded-r-xl border-l-0'}`}>

        {menuMovilAbierto ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
      </button>

      {menuMovilAbierto && (
        <>
        <button type="button" aria-label="Cerrar menú"
          onClick={() => setMenuMovilAbierto(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"/>

        <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r-2 border-orange-500
         bg-gray-900 text-white shadow-xl md:hidden">
          {contenidoMenu}
        </aside>
        </>
      )}
    </div>
    </>
  )
}
