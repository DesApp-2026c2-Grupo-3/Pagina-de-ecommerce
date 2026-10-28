import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import Productos from '../pages/Productos/Productos'
import NuevoProducto from '../pages/Productos/NuevoProducto'
import EditarProducto from '../pages/Productos/EditarProducto'
import Categorias from '../pages/Categorias/Categorias'
import NuevaCategoria from '../pages/Categorias/NuevaCategoria'
import EditarCategoria from '../pages/Categorias/EditarCategoria'
import Administradores from '../pages/Administradores/Administradores'
import NuevoAdministrador from '../pages/Administradores/NuevoAdministrador'
import EditarAdministrador from '../pages/Administradores/EditarAdministrador'
import NotFound from '../pages/NotFound'
import Sucursales from '../pages/Sucursales/Sucursales'
import NuevaSucursal from '../pages/Sucursales/NuevaSucursal'
import EditarSucursal from '../pages/Sucursales/EditarSucursal'
import Stock from '../pages/Stock/Stock'
import Insumos from '../pages/Insumos/Insumos'
import Pedidos from '../pages/pedidos/Pedidos'
import { SoloGestion, SoloMaster, SoloSuSucursal } from '../components/PermisoRol'
import Reportes from '../pages/Reportes/Reportes'
import ProductosMasVendidos from '../components/reportes/ProductosMasVendidos'
import ProductosMenosVendidos from '../components/reportes/ProductosMenosVendidos'
import ProductosMayorFacturacion from '../components/reportes/ProductosMayorFacturacion'
import ProductosSinStock from '../components/reportes/ProductosSinStock'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Pedidos: los ven los tres roles; el estado solo lo cambia el empleado */}
        <Route path="/admin/pedidos" element={<Pedidos />} />

        {/* Master y encargado (el empleado va directo a Pedidos) */}
        <Route element={<SoloGestion />}>
          <Route path="/admin" element={<Reportes />} />
          <Route path="/admin/reportes" element={<Reportes />} />
          <Route path="/admin/reportes/productos-mas-vendidos" element={<ProductosMasVendidos />} />
          <Route path="/admin/reportes/productos-menos-vendidos" element={<ProductosMenosVendidos />} />
          <Route path="/admin/reportes/productos-mayor-facturacion" element={<ProductosMayorFacturacion />} />
          <Route path="/admin/reportes/productos-sin-stock" element={<ProductosSinStock />} />

          <Route path="/admin/administradores" element={<Administradores />} />
          <Route path="/admin/administradores/nuevo" element={<NuevoAdministrador />} />
          <Route path="/admin/administradores/editar/:id" element={<EditarAdministrador />} />
        </Route>

        {/* Solo el master */}
        <Route element={<SoloMaster />}>
          <Route path="/admin/productos" element={<Productos />} />
          <Route path="/admin/productos/nuevo" element={<NuevoProducto />} />
          <Route path="/admin/productos/editar/:id" element={<EditarProducto />} />

          <Route path="/admin/categorias" element={<Categorias />} />
          <Route path="/admin/categorias/nueva" element={<NuevaCategoria />} />
          <Route path="/admin/categorias/editar/:id" element={<EditarCategoria />} />

          <Route path="/admin/insumos" element={<Insumos />} />

          <Route path="/admin/sucursales" element={<Sucursales />} />
          <Route path="/admin/sucursales/nueva" element={<NuevaSucursal />} />
        </Route>

        {/* El master, o el admin de esa sucursal */}
        <Route element={<SoloSuSucursal />}>
          <Route path="/admin/sucursales/editar/:id" element={<EditarSucursal />} />
          <Route path="/admin/sucursales/:id/stock" element={<Stock />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
