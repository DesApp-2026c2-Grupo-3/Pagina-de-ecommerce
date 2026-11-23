import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { cerrarSesionService } from '../services/authService'

export function useLogoutAdmin() {
  const { cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [saliendo, setSaliendo] = useState(false)

  const salir = useCallback(async () => {
    if (saliendo) return

    setSaliendo(true)

    try {
      await cerrarSesionService()
    } catch {
      // La sesión local se cierra igual: el logout no depende del backend.
    } finally {
      cerrarSesion()
      navigate('/', { replace: true })
      setSaliendo(false)
    }
  }, [cerrarSesion, navigate, saliendo])

  return { salir, saliendo }
}
