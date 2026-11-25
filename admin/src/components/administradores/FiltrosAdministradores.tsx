import type { ChangeEvent } from 'react'
import { Search } from 'lucide-react'
import type { FiltroRol } from '../../utils/administradores/filtrarAdministradores'
import { formatearContador } from '../../utils/listas/formatoContador'
import MenuFiltro from '../listas/MenuFiltro'

interface Props {
  busqueda: string
  onBusqueda: (valor: string) => void
  rol: FiltroRol
  onRol: (valor: FiltroRol) => void
  contadoresRol: Record<FiltroRol, number>
  sucursal: string
  onSucursal: (valor: string) => void
  sucursales: { id: number; nombre: string }[]
  contadoresSucursal: Record<string, number>
}

// Mismas opciones y nombres de hoy
const ROLES: { valor: FiltroRol; texto: string }[] = [
  { valor: 'todos', texto: 'Todos los roles' },
  { valor: 'MASTER', texto: 'General' },
  { valor: 'ADMIN', texto: 'Sucursal' },
]

const contador = (n: number) => ({ visible: formatearContador(n), real: n })

// Buscador y los dos filtros, siempre con nuestro menú propio (también el de rol, aunque tenga dos roles):
// escritorio (≥ 48 rem) al lado del buscador · tablet en dos mitades · celular uno debajo del otro.
export default function FiltrosAdministradores(props: Props) {
  return (
    <div className="mb-4 flex flex-col gap-3 @[48rem]:flex-row @[48rem]:items-center">
      <div className="relative w-full @[48rem]:w-80 @[48rem]:flex-none">
        <Search
          size={18}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <label htmlFor="filtro-administradores-buscar" className="sr-only">
          Buscar por nombre o email
        </label>
        <input
          id="filtro-administradores-buscar"
          type="search"
          value={props.busqueda}
          onChange={(e: ChangeEvent<HTMLInputElement>) => props.onBusqueda(e.target.value)}
          placeholder="Buscar por nombre o email..."
          className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-3"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @[48rem]:flex">
        <MenuFiltro
          id="filtro-rol"
          etiqueta="Filtrar por rol"
          opciones={ROLES.map((r) => ({ valor: r.valor, texto: r.texto, contador: contador(props.contadoresRol[r.valor] ?? 0) }))}
          valor={props.rol}
          onChange={(v) => {
            const elegido = ROLES.find((r) => r.valor === v)
            if (elegido) props.onRol(elegido.valor)
          }}
          className="min-w-0 @[48rem]:w-52"
        />
        <MenuFiltro
          id="filtro-sucursal-admin"
          etiqueta="Filtrar por sucursal"
          opciones={[
            { valor: 'todas', texto: 'Todas las sucursales', contador: contador(props.contadoresSucursal.todas ?? 0) },
            ...props.sucursales.map((s) => ({
              valor: String(s.id),
              texto: s.nombre,
              contador: contador(props.contadoresSucursal[String(s.id)] ?? 0),
            })),
          ]}
          valor={props.sucursal}
          onChange={props.onSucursal}
          className="min-w-0 @[48rem]:w-64"
        />
      </div>
    </div>
  )
}
