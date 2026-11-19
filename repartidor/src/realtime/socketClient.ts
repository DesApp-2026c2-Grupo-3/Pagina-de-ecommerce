import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../services/httpClient'
import { leerToken } from '../utils/sesion'

// Singleton: una sola conexión por sesión (D-03)
let socket: Socket | null = null

export function obtenerSocketRepartidor(): Socket {
  if (!socket) {
    socket = io(API_URL, {
      autoConnect: false,
      // Función: cada reintento toma el token guardado en ese momento (31.5)
      auth: (cb) => cb({ token: leerToken() ?? '' }),
    })
  }
  return socket
}

// Quita los manejadores y apaga la reconexión automática
export function desconectarSocketRepartidor() {
  if (!socket) return

  socket.removeAllListeners()
  socket.io.removeAllListeners()
  socket.disconnect()
  socket = null
}
