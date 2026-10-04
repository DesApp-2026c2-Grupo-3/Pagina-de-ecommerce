import { useState } from 'react'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './context/ToastContext'


export interface AdministradorSesion {
  id: number
  nombre: string
  email: string
  rol: 'ADMIN' | 'MASTER'
  sucursalId: number | null // null para el MASTER
  sucursal: { id: number; nombre: string } | null
}

function App() {
  const [administrador, setAdministrador] = useState<AdministradorSesion | null>(() => {
    try {
      const guardado = localStorage.getItem('administrador')
      if (!guardado) return null
      const sesion = JSON.parse(guardado)
      // Sesiones viejas (sin id ni sucursal): hay que volver a iniciar sesión
      if (!('id' in sesion) || !('sucursalId' in sesion)) return null
      return sesion
    } catch {
      return null
    }
  })

  const isAuthenticated = administrador !== null
  return (
    <ToastProvider>
      <AppRoutes
        isAuthenticated={isAuthenticated}
        setAdministrador={setAdministrador}
        administrador={administrador}
      />
    </ToastProvider>
  )
  
}

export default App
