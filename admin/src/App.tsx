import AppRoutes from './routes/AppRoutes'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
