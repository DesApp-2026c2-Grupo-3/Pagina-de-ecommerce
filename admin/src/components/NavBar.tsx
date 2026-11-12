import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShoppingBag, Package,
  Store, ChartNoAxesCombined, ChevronLeft, ChevronRight,Users, Wheat,
  Tags, Hamburger, Bike, type LucideIcon, Percent,
  Route,
  ChevronDown,
  ChevronUp,
  Star,
  ClipboardList,
  BookOpen,
  Building2,
  Settings2,} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { enlacesDe, type Enlace } from '../config/menu'
import { useLogoutAdmin } from '../hooks/useLogoutAdmin'
import NotificacionCampana from './notificaciones/NotificacionCampana'

interface NavBarProps {
  menuAbierto: boolean
  setMenuAbierto: (abierto: boolean) => void
}

const iconosPorEnlace: Record<string, LucideIcon> = {
  Inicio: LayoutDashboard,
  Pedidos: ShoppingBag,
  Calificaciones: Star,
  Productos: Package,
  Sucursales: Store,
  Reportes: ChartNoAxesCombined,
  Insumos: Wheat,
  Categorías: Tags,
  Promociones: Percent,
  Administradores: Users,
  Stock: Package,
  Repartidores: Bike,
  Viajes: Route,
  'Datos de la sucursal': Store,
  Parámetros: Settings2,
}

const iconosPorGrupo: Record<string, LucideIcon> = {
  Operaciones: ClipboardList,
  Catálogo: BookOpen,
  Organización: Building2,
  'Mi sucursal': Store,
}

// Un elemento del menú: un enlace suelto (Reportes) o un desplegable con sus enlaces
type ItemMenu =
  | { tipo: 'enlace'; enlace: Enlace }
  | { tipo: 'grupo'; nombre: string; enlaces: Enlace[] }

// Junta los enlaces con el mismo grupo, respetando el orden en que vienen
function armarItems(enlaces: Enlace[]): ItemMenu[] {
  const items: ItemMenu[] = []
  for (const enlace of enlaces) {
    if (!enlace.grupo) {
      items.push({ tipo: 'enlace', enlace })
      continue
    }
    const grupo = items.find((i) => i.tipo === 'grupo' && i.nombre === enlace.grupo)
    if (grupo && grupo.tipo === 'grupo') grupo.enlaces.push(enlace)
    else items.push({ tipo: 'grupo', nombre: enlace.grupo, enlaces: [enlace] })
  }
  return items
}

// Mismo criterio que NavLink para marcar la página actual
const estaActivo = (enlace: Enlace, ruta: string) =>
  enlace.end ? ruta === enlace.to : ruta === enlace.to || ruta.startsWith(`${enlace.to}/`)

// La leyenda que aparece al costado de un ícono con el menú contraído
interface Leyenda {
  texto: string
  top: number
  left: number
}


export default function Navbar({ menuAbierto, setMenuAbierto } : NavBarProps) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const { administrador } = useAuth()
  const { salir, saliendo } = useLogoutAdmin()

  const navRef = useRef<HTMLElement>(null)

  const [puedeSubir, setPuedeSubir] = useState(false)
  const [puedeBajar, setPuedeBajar] = useState(false)

  const enlaces = enlacesDe(administrador)
  const items = armarItems(enlaces)
  const { pathname } = useLocation()

  const mostrarTexto = menuAbierto || menuMovilAbierto

  // Desplegable abierto: uno solo a la vez. Arranca abierto el de la página actual.
  const grupoActual = enlaces.find((e) => e.grupo && estaActivo(e, pathname))?.grupo ?? null
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(grupoActual)

  // Al cambiar de página se abre el desplegable que la contiene
  // (se compara con el grupo de la página anterior, así no hace falta un useEffect)
  const [grupoAnterior, setGrupoAnterior] = useState(grupoActual)
  if (grupoActual !== grupoAnterior) {
    setGrupoAnterior(grupoActual)
    if (grupoActual) setGrupoAbierto(grupoActual)
  }

  function alternarGrupo(nombre: string) {
    if (!mostrarTexto) {
      // Contraído: se expande el menú y se abre ese grupo
      setMenuAbierto(true)
      setGrupoAbierto(nombre)
      return
    }
    setGrupoAbierto((actual) => (actual === nombre ? null : nombre))
  }

  // Leyenda al costado del ícono (solo con el menú contraído). Va con posición fija en la pantalla:
  // dentro del menú quedaría cortada, porque el menú tiene scroll.
  const [leyenda, setLeyenda] = useState<Leyenda | null>(null)

  function mostrarLeyenda(evento: MouseEvent<HTMLElement>, texto: string) {
    if (mostrarTexto) return
    const caja = evento.currentTarget.getBoundingClientRect()
    setLeyenda({ texto, top: caja.top + caja.height / 2, left: caja.right + 14 })
  }

  const ocultarLeyenda = () => setLeyenda(null)

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

  useEffect(() => { const nav = navRef.current
    if (!nav) return

    const actualizarIndicadores = () => {
      setPuedeSubir(nav.scrollTop > 0)

      setPuedeBajar(
        nav.scrollTop + nav.clientHeight < nav.scrollHeight - 1
      )
    }

    actualizarIndicadores()

    // Si el menú se desplaza, la leyenda quedaría lejos de su ícono
    const alDesplazar = () => {
      actualizarIndicadores()
      setLeyenda(null)
    }

    nav.addEventListener('scroll', alDesplazar)
    window.addEventListener('resize', actualizarIndicadores)

    return () => {
      nav.removeEventListener('scroll', alDesplazar)
      window.removeEventListener('resize', actualizarIndicadores)
    }
  }, [enlaces.length, grupoAbierto, mostrarTexto])

  const rolTexto =
    administrador?.rol === 'MASTER'
      ? 'Administrador general'
      : `Sucursal ${administrador?.sucursal?.nombre ?? 'sin asignar'}`

  const contenidoMenu = (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
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

    <div className="relative flex-1 min-h-0 menu-scroll-container">

  <nav
    ref={navRef}
    className="flex h-full min-h-0 flex-col space-y-2
      overflow-y-auto overscroll-contain p-3
      [scrollbar-width:none]
      [&::-webkit-scrollbar]:hidden"
  >
    {items.map((item) => {
      // ---------- Enlace suelto (Reportes) ----------
      if (item.tipo === 'enlace') {
        const { enlace } = item
        const Icono = iconosPorEnlace[enlace.label] ?? Store
        return (
          <NavLink
            key={enlace.to}
            to={enlace.to}
            end={enlace.end}
            aria-label={enlace.label}
            onMouseEnter={(e) => mostrarLeyenda(e, enlace.label)}
            onMouseLeave={ocultarLeyenda}
            onClick={() => { setMenuMovilAbierto(false); ocultarLeyenda() }}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
                isActive
                  ? 'bg-orange-500/15 font-semibold text-orange-400'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <Icono size={20} className="shrink-0" />
            {mostrarTexto && <span>{enlace.label}</span>}
          </NavLink>
        )
      }

      // ---------- Desplegable ----------
      const Icono = iconosPorGrupo[item.nombre] ?? Store
      const abierto = mostrarTexto && grupoAbierto === item.nombre
      const contieneActual = item.enlaces.some((e) => estaActivo(e, pathname))

      return (
        <div key={item.nombre}>
          <button
            type="button"
            onClick={() => { alternarGrupo(item.nombre); ocultarLeyenda() }}
            onMouseEnter={(e) => mostrarLeyenda(e, item.nombre)}
            onMouseLeave={ocultarLeyenda}
            aria-expanded={abierto}
            aria-label={item.nombre}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors ${
              contieneActual
                ? 'font-semibold text-orange-400'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            } ${contieneActual && !abierto ? 'bg-orange-500/15' : ''}`}
          >
            <Icono size={20} className="shrink-0" />
            {mostrarTexto && (
              <>
                <span className="flex-1 text-left">{item.nombre}</span>
                <ChevronDown size={16} className={`shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {abierto && (
            <div className="ml-5 mt-1 space-y-1 border-l border-gray-700 pl-3">
              {item.enlaces.map((enlace) => {
                const IconoEnlace = iconosPorEnlace[enlace.label] ?? Store
                return (
                  <NavLink
                    key={enlace.to}
                    to={enlace.to}
                    end={enlace.end}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-orange-500/15 font-semibold text-orange-400'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <IconoEnlace size={18} className="shrink-0" />
                    <span>{enlace.label}</span>
                  </NavLink>
                )
              })}
            </div>
          )}
        </div>
      )
    })}
  </nav>

  {/* Indicador superior */}
  {puedeSubir && (
    <button
      type="button"
      onClick={(e) => {
        const nav = e.currentTarget.parentElement?.querySelector('nav')

      nav?.scrollBy({
        top: -150,
        behavior: 'smooth'
      })
      }}
      className="absolute left-1/2 top-1 z-10 -translate-x-1/2
        rounded-full bg-gray-800/90 p-1.5 text-orange-400
        shadow-lg hover:bg-gray-700"
        aria-label="Desplazar hacia arriba"
      >
      <ChevronUp size={18} />
    </button>
  )}

  {/* Indicador inferior */}
  {puedeBajar && (
    <button
      type="button"
      onClick={(e) => {
        const nav = e.currentTarget.parentElement?.querySelector('nav')

      nav?.scrollBy({
        top: 150,
        behavior: 'smooth'
      })
    }}
      className="absolute bottom-1 left-1/2 z-10 -translate-x-1/2
        rounded-full bg-gray-800/90 p-1.5 text-orange-400
        shadow-lg hover:bg-gray-700"
        aria-label="Desplazar hacia abajo"
      >
      <ChevronDown size={18} />
    </button>
  )}

</div>

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

          <button type="button" onClick={() => void salir()}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          disabled={saliendo}
          className="flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-300 hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50">
            <LogOut size={20} />
          </button>
  
        </div>
      </div>
    
    </div>
  )

  return (
    <>
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
      <div className="min-w-0 flex-1">
        <p className="whitespace-normal break-words text-sm font-semibold text-slate-800 [overflow-wrap:anywhere]">
          Panel de administración
        </p>
        <p className="mt-0.5 whitespace-normal break-words text-xs text-slate-500 [overflow-wrap:anywhere]">
          Gestioná pedidos, stock y novedades.
        </p>
      </div>

      <NotificacionCampana />
    </div>

    {/* Leyenda del ícono con el menú contraído: al costado, así el mouse no la tapa */}
    {/* Con el menú expandido ya se leen los nombres: la leyenda no hace falta */}
    {leyenda && !mostrarTexto && (
      <div
        role="tooltip"
        style={{ top: leyenda.top, left: leyenda.left }}
        className="pointer-events-none fixed z-[70] -translate-y-1/2 whitespace-nowrap rounded-lg border border-orange-500
          bg-gray-900 px-3 py-2 text-base font-semibold text-white shadow-xl"
      >
        {/* Flechita que apunta al ícono */}
        <span className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b border-l border-orange-500 bg-gray-900" />
        {leyenda.texto}
      </div>
    )}

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