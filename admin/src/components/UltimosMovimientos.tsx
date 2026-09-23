interface Movimiento {
  tipo: 'creado' | 'actualizado' | 'eliminado'
  descripcion: string
  tiempo: string
}

const movimientos: Movimiento[] = [
  {
    tipo: 'creado',
    descripcion: 'Producto "Hamburgueja al vapor" creado',
    tiempo: 'Hace 5 minutos',
  },
  {
    tipo: 'actualizado',
    descripcion: 'Producto "Hamburguesa Bacon" actualizado',
    tiempo: 'Hace 20 minutos',
  },
  {
    tipo: 'eliminado',
    descripcion: 'Producto "Pollo Frito" eliminado',
    tiempo: 'Hace 1 hora',
  },
  {
    tipo: 'creado',
    descripcion: 'Categoría "Ensalada" creada',
    tiempo: 'Hace 2 horas',
  },
]

export default function UltimosMovimientos() {
  return (
    <div className="bg-surface border rounded-lg mt-6">
      <h2 className="text-center text-xl text-white font-semibold p-4 -m-1 rounded border
      bg-secondary ">
        Ultimos movimientos
      </h2>

      <div className="space-y-4 p-6">
        {movimientos.map((movimiento, index) => (
          <div
            key={index}
            className="border-b last:border-b-0 pb-4 last:pb-0"
          >
            <p className="font-medium">
              {movimiento.descripcion}
            </p>

            <p className="text-sm text-gray-500 mt-1">
              {movimiento.tiempo}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}