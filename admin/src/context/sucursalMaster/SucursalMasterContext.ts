import { createContext } from 'react'
import type { SucursalOpcion } from '../../types/pedido.types'

export interface ValorSucursalMaster {
  // null = todavía cargando (o no es MASTER)
  sucursales: SucursalOpcion[] | null
  errorSucursales: string
  // La última que eligió el MASTER en Pedidos o Viajes (sessionStorage, D-V2/D-V4)
  guardada: number | null
  guardar: (sucursalId: number) => void
}

export const SucursalMasterContext = createContext<ValorSucursalMaster | null>(null)
