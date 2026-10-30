import type {
  Repartidor,
  PayloadRepartidor,
} from '../types/repartidor.types'

import { apiFetch, API_URL } from './httpClient'

const API = `${API_URL}/admin/repartidores`

export async function obtenerRepartidores(): Promise<Repartidor[]> {
  return apiFetch(API, {
    mensajePorDefecto: 'Error al obtener los repartidores',
  })
}

export async function crearRepartidor(repartidor: PayloadRepartidor): Promise<Repartidor> {
    
    return apiFetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(repartidor),
        mensajePorDefecto: 'Error al crear el repartidor',
    })
}