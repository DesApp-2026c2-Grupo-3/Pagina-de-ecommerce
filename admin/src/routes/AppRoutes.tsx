import { Route, Routes } from 'react-router-dom'
import Home from '../pages/Home'
import AdminHome from '../pages/AdminHome'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminLayout from '../components/AdminLayout'
import Productos from '../pages/Productos'
import NuevoProducto from '../pages/NuevoProducto'
import EditarProducto from '../pages/EditarProducto'

interface AppRoutesProps {
  isAuthenticated: boolean
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

export default function AppRoutes({ isAuthenticated, setIsAuthenticated }: AppRoutesProps){
    

    return(
        <Routes>
            <Route path='/' element={
                <Home setIsAuthenticated={setIsAuthenticated}/>}
            />

            <Route element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                    <AdminLayout />
                </ProtectedRoute>}>
            
                <Route path="/admin" element={<AdminHome />} />
                                    
                <Route path="/admin/productos" element={<Productos />} />

                <Route path="/admin/productos/nuevo" element={<NuevoProducto />}/>

                <Route path="/admin/productos/editar/:id" element={<EditarProducto />}/>
            </Route>
        </Routes>
    )
}