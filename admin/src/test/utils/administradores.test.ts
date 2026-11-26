import { describe, expect, it } from 'vitest'
import { POR_PAGINA_ADMINISTRADORES } from '../../config/administradores'
import type { AdministradorFila } from '../../types/administrador.types'
import {
  contarPorRol,
  contarPorSucursal,
  esFiltroRol,
  filtrarAdministradores,
  rolTexto,
  sucursalesDeLaLista,
} from '../../utils/administradores/filtrarAdministradores'

const centro = { id: 1, nombre: 'Sucursal Centro' }
const rosario = { id: 2, nombre: 'Sucursal Rosario' }

function adm(id: number, nombre: string, email: string, extra: Partial<AdministradorFila> = {}): AdministradorFila {
  return { id, nombre, email, rol: 'ADMIN', activo: true, sucursal: centro, ...extra }
}

const lista = [
  adm(1, 'Laura Fernández', 'laura@burgerfast.com', { rol: 'MASTER', sucursal: null }),
  adm(2, 'Martín Gómez', 'martin@burgerfast.com'),
  adm(3, 'Diego Ruiz', 'diego@burgerfast.com', { sucursal: rosario, activo: false }),
  adm(4, 'Ana Paz', 'ana.centro@burgerfast.com'),
]
const todos = { busqueda: '', rol: 'todos' as const, sucursal: 'todas' }

describe('filtros de administradores (misma lógica que antes)', () => {
  it('busca por nombre o por mail', () => {
    expect(filtrarAdministradores(lista, { ...todos, busqueda: ' DIEGO ' }).map((a) => a.id)).toEqual([3])
    expect(filtrarAdministradores(lista, { ...todos, busqueda: 'centro' }).map((a) => a.id)).toEqual([4])
  })
  it('filtra por rol y por sucursal', () => {
    expect(filtrarAdministradores(lista, { ...todos, rol: 'MASTER' }).map((a) => a.id)).toEqual([1])
    expect(filtrarAdministradores(lista, { ...todos, sucursal: '1' }).map((a) => a.id)).toEqual([2, 4])
    expect(filtrarAdministradores(lista, { ...todos, rol: 'MASTER', sucursal: '1' })).toEqual([])
  })
  it('sucursales de la lista, sin repetir y ordenadas por nombre', () => {
    expect(sucursalesDeLaLista(lista).map((s) => s.id)).toEqual([1, 2])
  })
  it('texto del rol como hoy', () => {
    expect(rolTexto('MASTER')).toBe('General')
    expect(rolTexto('ADMIN')).toBe('Sucursal')
  })
})

describe('contadores de los menús', () => {
  it('por rol, sobre la búsqueda y la sucursal', () => {
    expect(contarPorRol(lista, { busqueda: '', sucursal: 'todas' })).toEqual({ todos: 4, MASTER: 1, ADMIN: 3 })
    expect(contarPorRol(lista, { busqueda: '', sucursal: '2' })).toEqual({ todos: 1, MASTER: 0, ADMIN: 1 })
  })
  it('por sucursal, sobre la búsqueda y el rol', () => {
    expect(contarPorSucursal(lista, { busqueda: '', rol: 'todos' })).toEqual({ todas: 4, '1': 2, '2': 1 })
    expect(contarPorSucursal(lista, { busqueda: '', rol: 'ADMIN' })).toEqual({ todas: 3, '1': 2, '2': 1 })
  })
  it('rol válido en la URL y hasta 10 por página', () => {
    expect(esFiltroRol('ADMIN')).toBe(true)
    expect(esFiltroRol('admin')).toBe(false)
    expect(POR_PAGINA_ADMINISTRADORES).toBe(10)
  })
})
