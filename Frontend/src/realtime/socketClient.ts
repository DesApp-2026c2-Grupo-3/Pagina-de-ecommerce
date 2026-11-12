import { io, type Socket } from 'socket.io-client'
import { API_URL } from '../services/httpClient'

let socket: Socket | null = null
let tokenActual: string | null = null

export function obtenerSocketCliente(token: string | null): Socket | null {
  const tokenNormalizado = (token ?? '').trim()

  if (!tokenNormalizado) {
    desconectarSocketCliente()
    return null
  }

  if (socket && tokenActual === tokenNormalizado) {
    return socket
  }

  desconectarSocketCliente()

  tokenActual = tokenNormalizado
  socket = io(API_URL, {
    autoConnect: false,
    auth: { token: tokenNormalizado },
  })

  return socket
}

export function desconectarSocketCliente() {
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
