import { httpClient } from './httpClient'
import type { Promociones } from '../types/promo'

// Las promos las arma el Admin-Master en el panel (tabla Promociones) y el backend las valida al crear el pedido
export const getPromociones = () => httpClient<Promociones>('/promociones')
