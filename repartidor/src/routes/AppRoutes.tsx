
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import Login from '../pages/Login/Login'
import MainLayout from '../components/layout/MainLayout'
import Inicio from '../pages/Inicio/Inicio'

function Inicio() {
  const { repartidor, logout } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        ¡Hola, {repartidor?.nombre}!
      </h1>

      <button
        onClick={logout}
        className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-white"
      >
        Cerrar sesión
      </button>
    </div>
  )
}

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
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
