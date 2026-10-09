import type { AdministradorSesion } from '../App'

export interface Enlace {
  to: string
  label: string
  end?: boolean // true = activo solo con la ruta exacta (para "Inicio")
}

// Qué ve cada rol en el menú (NavBar y footer)
export function enlacesDe(administrador: AdministradorSesion | null): Enlace[] {
  if (administrador?.rol === 'MASTER') {
    return [
      { to: '/admin', label: 'Inicio', end: true },
      { to: '/admin/pedidos', label: 'Pedidos' },
      { to: '/admin/productos', label: 'Productos' },
      { to: '/admin/insumos', label: 'Insumos' },
      { to: '/admin/categorias', label: 'Categorías' },
      { to: '/admin/sucursales', label: 'Sucursales' },
      { to: '/admin/administradores', label: 'Administradores' },
    ]
  }

  const id = administrador?.sucursalId
  return [
    { to: '/admin', label: 'Inicio', end: true },
    ...(id
      ? [
          { to: '/admin/pedidos', label: 'Pedidos' },
          { to: `/admin/sucursales/${id}/stock`, label: 'Stock' },
          { to: `/admin/sucursales/editar/${id}`, label: 'Mi sucursal' },
        ]
      : []),
  ]
}