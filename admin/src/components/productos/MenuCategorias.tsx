import MenuFiltro from '../listas/MenuFiltro'

// Filtro de categorías: siempre desplegable propio, en todos los tamaños (plan de Productos).
// Mismas opciones, orden y nombres que el <select> anterior, sin contadores (D-P4).
export default function MenuCategorias({
  categorias,
  valor,
  onChange,
}: {
  categorias: { id: number; nombre: string }[]
  // 'todas' o el id de la categoría
  valor: string
  onChange: (valor: string) => void
}) {
  return (
    <MenuFiltro
      id="filtro-categoria"
      etiqueta="Filtrar por categoría"
      opciones={[
        { valor: 'todas', texto: 'Todas las categorías' },
        ...categorias.map((c) => ({ valor: String(c.id), texto: c.nombre })),
      ]}
      valor={valor}
      onChange={onChange}
      className="min-w-0 flex-1 @xl:w-56 @xl:flex-none @[60rem]:w-64"
    />
  )
}
