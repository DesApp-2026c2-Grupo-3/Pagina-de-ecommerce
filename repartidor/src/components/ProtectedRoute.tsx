import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { repartidor, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Verificando sesión...</p>
      </div>
    )
  }

  return repartidor ? <Outlet /> : <Navigate to="/login" replace />
}