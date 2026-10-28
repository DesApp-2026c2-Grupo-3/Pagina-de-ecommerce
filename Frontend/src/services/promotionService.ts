import { httpClient } from './httpClient'
import type { Promociones } from '../types/promo'

// Las promos las define el backend (config/promociones.js) y las valida al crear el pedido
export const getPromociones = () => httpClient<Promociones>('/promociones')
