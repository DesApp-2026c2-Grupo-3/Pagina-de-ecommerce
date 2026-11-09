import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../services/httpClient'
import { CLAVE_TOKEN } from '../utils/sesion'

let socket: Socket | null = null
let tokenActual: string | null = null

export function obtenerSocketAdmin(token: string | null): Socket | null {
  const tokenNormalizado = (
    token ?? localStorage.getItem(CLAVE_TOKEN) ?? ''
  ).trim()

  if (!tokenNormalizado) {
    desconectarSocketAdmin()
    return null
  }

  if (socket && tokenActual === tokenNormalizado) {
    return socket
  }

  desconectarSocketAdmin()

  tokenActual = tokenNormalizado
  socket = io(API_URL, {
    autoConnect: false,
    auth: { token: tokenNormalizado },
  })

  return socket
}

export function desconectarSocketAdmin() {
  if (!socket) {
    tokenActual = null
    return
  }

  socket.removeAllListeners()
  socket.io.removeAllListeners()
  socket.disconnect()
  socket = null
  tokenActual = null
}
