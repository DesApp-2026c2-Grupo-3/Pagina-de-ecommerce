
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Bike, ClipboardList, History, LogOut, MapPinned } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const enlaces = [
  { nombre: 'Inicio', ruta: '/', icono: Bike },
  { nombre: 'Pedidos', ruta: '/pedidos', icono: ClipboardList },
  { nombre: 'Mi viaje', ruta: '/viaje', icono: MapPinned },
  { nombre: 'Historial', ruta: '/historial', icono: History },
]

export default function MainLayout() {
  const { repartidor, logout } = useAuth()
  const navigate = useNavigate()

  const manejarLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white">
              <Bike size={23} />
            </div>

            <div>
              <h1 className="font-bold text-slate-900">Repartidor</h1>
              <p className="text-xs text-slate-500">Panel de entregas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {repartidor?.nombre} {repartidor?.apellido}
              </p>
              <p className="text-xs text-slate-500">
                Sucursal #{repartidor?.sucursalId}
              </p>
            </div>

            <button
              onClick={manejarLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {enlaces.map(({ nombre, ruta, icono: Icono }) => (
            <NavLink
              key={ruta}
              to={ruta}
              end={ruta === '/'}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`
              }
            >
              <Icono size={18} />
              {nombre}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
