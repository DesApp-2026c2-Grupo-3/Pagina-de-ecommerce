import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'

// Cerrar sesión siempre igual, se llame desde donde se llame: vacía carrito y zona y vuelve al inicio
export function useCerrarSesion() {
  const { logout } = useAuth()
  const { clearCart } = useCart()
  const { limpiarZona } = useZona()
  const navigate = useNavigate()

  return () => {
    logout()
    clearCart()
    navigate('/')
    limpiarZona()
  }
}