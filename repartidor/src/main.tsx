import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthProvider'
import { RealtimeProvider } from './context/realtime/RealtimeProvider'
import { NotificacionProvider } from './context/notificaciones/NotificacionProvider'
import { ToastProvider } from './context/toasts/ToastProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          {/* Por encima de las notificaciones: la bandeja avisa con toasts si una lectura falla */}
          <ToastProvider>
            <NotificacionProvider>
              <App />
            </NotificacionProvider>
          </ToastProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
