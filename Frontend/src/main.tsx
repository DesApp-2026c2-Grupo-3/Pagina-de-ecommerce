import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext.tsx'
import { ToastProvider } from './context/ToastContext.tsx'
import { RealtimeProvider } from './context/realtime/RealtimeProvider'
import { NotificacionProvider } from './context/notificaciones/NotificacionProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <RealtimeProvider>
          <ToastProvider>
            <NotificacionProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </NotificacionProvider>
          </ToastProvider>
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)