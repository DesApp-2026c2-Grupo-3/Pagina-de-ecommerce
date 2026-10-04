import { Link } from 'react-router-dom'
import { Boxes, ClipboardList, Package, Store, Tags, Users, Wheat } from 'lucide-react'
import type { AdministradorSesion } from '../App'
import UltimosMovimientos from '../components/UltimosMovimientos'

interface AdminHomeProps {
  administrador: AdministradorSesion | null
}

const accesoClase =
  'flex items-center gap-3 rounded-lg border bg-white p-4 font-semibold shadow-sm transition-shadow hover:shadow-md'

export default function AdminHome({ administrador }: AdminHomeProps) {
  const esMaster = administrador?.rol === 'MASTER'
  const sucursalId = administrador?.sucursalId

  return (
    <main className="min-h-screen p-8">
      <div className="m-2 flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Hola, {administrador?.nombre}</h1>
        <p className="text-gray-600">
          {esMaster
            ? 'Administración general: catálogo, sucursales y administradores.'
            : `Administración de ${administrador?.sucursal?.nombre ?? 'tu sucursal'}.`}
        </p>
      </div>

      {/* Accesos rápidos según el rol */}
      <div className="m-2 mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {esMaster ? (
          <>
            <Link to="/admin/productos" className={accesoClase}>
              <Package /> Productos
            </Link>
            <Link to="/admin/insumos" className={accesoClase}>
              <Wheat /> Insumos
            </Link>
            <Link to="/admin/categorias" className={accesoClase}>
              <Tags /> Categorías
            </Link>
            <Link to="/admin/sucursales" className={accesoClase}>
              <Store /> Sucursales y stock
            </Link>
            <Link to="/admin/administradores" className={accesoClase}>
              <Users /> Administradores
            </Link>
          </>
        ) : sucursalId ? (
          <>
            <Link to={`/admin/sucursales/${sucursalId}/stock`} className={accesoClase}>
              <Boxes /> Stock de mi sucursal
            </Link>
            <Link to={`/admin/sucursales/editar/${sucursalId}`} className={accesoClase}>
              <Store /> Datos de mi sucursal
            </Link>
            <div className={`${accesoClase} cursor-default text-gray-400`}>
              <ClipboardList /> Pedidos (próximamente)
            </div>
          </>
        ) : (
          <p className="text-gray-600">No tenés una sucursal asignada. Pedile al administrador general que te asigne una.</p>
        )}
      </div>

      <UltimosMovimientos />
    </main>
  )
}