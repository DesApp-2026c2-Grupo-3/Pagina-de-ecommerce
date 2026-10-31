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

export async function obtenerRepartidorPorId(id: number): Promise<Repartidor> {
    return apiFetch(`${API}/${id}`, {
        mensajePorDefecto: 'Error al obtener el repartidor',
    });
}

export async function actualizarRepartidor(id: number, datos: Partial<PayloadRepartidor>): Promise<Repartidor> {
    return apiFetch(`${API}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(datos),
        mensajePorDefecto: 'Error al actualizar el repartidor',
    });
}

export async function desactivarRepartidor(id: number): Promise<{ mensaje: string }> {
    return apiFetch(`${API}/${id}/desactivar`, {
        method: 'PATCH',
        mensajePorDefecto: 'Error al desactivar el repartidor',
    })
}

export async function reactivarRepartidor(id: number): Promise<{ mensaje: string }> {
    return apiFetch(`${API}/${id}/reactivar`, {
        method: 'PATCH',
        mensajePorDefecto: 'Error al reactivar el repartidor',
    })
}