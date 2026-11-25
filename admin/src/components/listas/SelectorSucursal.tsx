import type { SucursalOpcion } from '../../types/pedido.types'
import MenuFiltro from './MenuFiltro'

// Selector de sucursal: solo lo ve el MASTER (RN-35). Usa el menú propio (plan de filtros v2, D-F2),
// igual que el filtro de estado, para que nunca se salga de la pantalla.
export default function SelectorSucursal({
  sucursales,
  sucursalId,
  onChange,
  todas,
  className = '',
}: {
  sucursales: SucursalOpcion[]
  sucursalId: number | null
  onChange: (id: number) => void
  // Opción «Todas las sucursales» (Repartidores). Pedidos y Viajes no la usan.
  todas?: { etiqueta: string; onElegir: () => void }
  className?: string
}) {
  const opciones = [
    ...(todas ? [{ valor: '', texto: todas.etiqueta }] : []),
    ...sucursales.map((s) => ({ valor: String(s.id), texto: s.activa ? s.nombre : `${s.nombre} (inactiva)` })),
  ]

  return (
    <MenuFiltro
      id="filtro-sucursal"
      etiqueta="Elegir sucursal"
      opciones={opciones}
      valor={sucursalId !== null ? String(sucursalId) : ''}
      onChange={(valor) => {
        if (valor === '' && todas) todas.onElegir()
        else onChange(Number(valor))
      }}
      className={className}
    />
  )
}
