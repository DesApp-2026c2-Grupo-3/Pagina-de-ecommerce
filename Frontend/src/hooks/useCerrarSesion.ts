import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useZona } from '../context/ZonaContext'
import { anunciarDespedida } from '../utils/despedida'

// Lo que tarda en subir la cortina de "Hasta pronto": la sesión se cierra cuando ya tapa la página
const ESPERA_CORTINA_MS = 600

// Cerrar sesión siempre igual, se llame desde donde se llame: vacía carrito y zona y vuelve al inicio
export function useCerrarSesion() {
  const { user, logout } = useAuth()
  const { clearCart } = useCart()
  const { limpiarZona } = useZona()
  const navigate = useNavigate()

  return () => {
    anunciarDespedida(user?.name.split(' ')[0] ?? '')
    setTimeout(() => {
      logout()
      clearCart()
      navigate('/')
      limpiarZona()
    }, ESPERA_CORTINA_MS)
  }
}