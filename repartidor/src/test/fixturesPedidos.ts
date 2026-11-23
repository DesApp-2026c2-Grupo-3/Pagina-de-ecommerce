import type { Pedido } from '../types/pedido.types'

export function pedido(id: number, cambios: Partial<Pedido> = {}): Pedido {
  return {
    id,
    fecha: '2026-11-17T10:00:00.000Z',
    total: 15000,
    estado: 'Listo para retirar',
    retiradoEn: null,
    observaciones: null,
    Usuario: { id: 3, nombre: 'Laura', apellido: 'Gómez', telefono: '3415550000' },
    Direccion: {
      id: 9, alias: null, calle: 'Córdoba', numero: '1200', piso: null, localidad: 'Rosario', provincia: 'Santa Fe',
      observaciones: null, latitud: null, longitud: null,
    },
    DetallePedidos: [{ id: 1, cantidad: 2, precio: 7500, Producto: { id: 4, nombre: 'Hamburguesa', imagen: null } }],
    ...cambios,
  }
}
