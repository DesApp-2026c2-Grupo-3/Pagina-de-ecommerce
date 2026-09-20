import { useState } from 'react'
import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './context/ToastContext'


export interface AdministradorSesion {
  nombre: string
  email: string
  rol: 'ADMIN' | 'MASTER'
}

function App() {
  const [administrador, setAdministrador] =
  useState<AdministradorSesion | null>(() => {
    const administradorGuardado =
      localStorage.getItem('administrador')

    if (!administradorGuardado) {
      return null
    }

    return JSON.parse(administradorGuardado)
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
