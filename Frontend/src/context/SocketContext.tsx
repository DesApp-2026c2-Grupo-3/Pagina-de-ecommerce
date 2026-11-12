import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext<Socket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setSocket(null)
      return
    }

    const nuevaConexion = io(import.meta.env.VITE_API_URL || 'http://localhost:3000')

    nuevaConexion.on('connect', () => {
      nuevaConexion.emit('suscribir_cliente', { usuarioId: user.id })
    })

    setSocket(nuevaConexion)

    return () => {
      nuevaConexion.disconnect()
    }
  }, [user?.id])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
