import type { AdministradorSesion } from '../types/sesion.types'

export interface Enlace {
  to: string
  label: string
  end?: boolean // true = activo solo con la ruta exacta (para "Inicio")
  /** Desplegable del NavBar en el que va. Sin grupo = enlace suelto (Reportes) */
  grupo?: string
}

// Qué ve cada rol en el menú (NavBar y footer).
// El NavBar junta en un desplegable los enlaces con el mismo `grupo`, en el orden en que aparecen acá.
export function enlacesDe(administrador: AdministradorSesion | null): Enlace[] {
  if (administrador?.rol === 'MASTER') {
    return [
      { to: '/admin', label: 'Reportes', end: true },
      { to: '/admin/pedidos', label: 'Pedidos', grupo: 'Operaciones' },
      { to: '/admin/viajes', label: 'Viajes', grupo: 'Operaciones' },
      { to: '/admin/calificaciones', label: 'Calificaciones', grupo: 'Operaciones' },
      { to: '/admin/productos', label: 'Productos', grupo: 'Catálogo' },
      { to: '/admin/categorias', label: 'Categorías', grupo: 'Catálogo' },
      { to: '/admin/insumos', label: 'Insumos', grupo: 'Catálogo' },
      { to: '/admin/promociones', label: 'Promociones', grupo: 'Catálogo' },
      { to: '/admin/sucursales', label: 'Sucursales', grupo: 'Organización' },
      { to: '/admin/administradores', label: 'Administradores', grupo: 'Organización' },
      { to: '/admin/repartidores', label: 'Repartidores', grupo: 'Organización' },
    ]
  }

  const id = administrador?.sucursalId
  return [
    { to: '/admin', label: 'Reportes', end: true },
    ...(id
      ? [
          { to: '/admin/pedidos', label: 'Pedidos', grupo: 'Operaciones' },
          { to: '/admin/viajes', label: 'Viajes', grupo: 'Operaciones' },
          { to: '/admin/calificaciones', label: 'Calificaciones', grupo: 'Operaciones' },
          { to: `/admin/sucursales/editar/${id}`, label: 'Datos de la sucursal', grupo: 'Mi sucursal' },
          { to: `/admin/sucursales/${id}/stock`, label: 'Stock', grupo: 'Mi sucursal' },
          { to: '/admin/repartidores', label: 'Repartidores', grupo: 'Mi sucursal' },
        ]
      : []),
  ]
}