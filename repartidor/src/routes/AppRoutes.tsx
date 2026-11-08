
import { Navigate, Route, Routes } from 'react-router-dom'

import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login/Login'
import MainLayout from '../components/layout/MainLayout'
import Inicio from '../pages/Inicio/Inicio'
import Pedidos from '../pages/Pedidos/Pedidos'
import Viaje from '../pages/Viaje/Viaje'
import Historial from '../pages/Historial/Historial'

export default function AppRoutes() {
  const { repartidor, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Cargando aplicación...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          repartidor
            ? <Navigate to="/" replace />
            : <Login />
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/viaje" element={<Viaje />} />
          <Route path="/historial" element={<Historial />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
