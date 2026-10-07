import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import AdminHome from '../pages/AdminHome'
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
import type { AdministradorSesion } from '../App'
import Sucursales from '../pages/Sucursales/Sucursales'
import NuevaSucursal from '../pages/Sucursales/NuevaSucursal'
import EditarSucursal from '../pages/Sucursales/EditarSucursal'
import Stock from '../pages/Stock/Stock'
import Insumos from '../pages/Insumos/Insumos'
import Pedidos from '../pages/pedidos/Pedidos'
import { SoloMaster, SoloSuSucursal } from '../components/PermisoRol'

interface AppRoutesProps {
  isAuthenticated: boolean
  administrador: AdministradorSesion | null
  setAdministrador: React.Dispatch<
    React.SetStateAction<AdministradorSesion | null>
  >
}

export default function AppRoutes({ isAuthenticated, administrador ,setAdministrador }: AppRoutesProps){
    

    return(
        <Routes>
            <Route path='/' element={
                <Home setAdministrador={setAdministrador}/>}
            />

            <Route element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AdminLayout administrador={administrador} setAdministrador={setAdministrador} />
                </ProtectedRoute>}>
                 <Route path="/admin" element={<AdminHome administrador={administrador} />} />
                 <Route path="/admin/pedidos" element={<Pedidos administrador={administrador} />} />

                {/* Solo el master */}
                <Route element={<SoloMaster administrador={administrador} />}>
                    <Route path="/admin/productos" element={<Productos />} />
                    <Route path="/admin/productos/nuevo" element={<NuevoProducto />} />
                    <Route path="/admin/productos/editar/:id" element={<EditarProducto />} />

                    <Route path="/admin/categorias" element={<Categorias />} />
                    <Route path="/admin/categorias/nueva" element={<NuevaCategoria />} />
                    <Route path="/admin/categorias/editar/:id" element={<EditarCategoria />} />

                    <Route path="/admin/insumos" element={<Insumos />} />

                    <Route path="/admin/administradores" element={<Administradores />} />
                    <Route path="/admin/administradores/nuevo" element={<NuevoAdministrador />} />
                    <Route path="/admin/administradores/editar/:id" element={<EditarAdministrador />} />

                    <Route path="/admin/sucursales" element={<Sucursales />} />
                    <Route path="/admin/sucursales/nueva" element={<NuevaSucursal />} />
                </Route>

                {/* El master, o el admin de esa sucursal */}
                <Route element={<SoloSuSucursal administrador={administrador} />}>
                    <Route path="/admin/sucursales/editar/:id" element={<EditarSucursal />} />
                    <Route path="/admin/sucursales/:id/stock" element={<Stock />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
        </Routes>
    )
}