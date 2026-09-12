import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function EditarProducto() {
    const { id } = useParams();
    const navigate = useNavigate();

    const productosGuardados = JSON.parse(
  localStorage.getItem('productos') || '[]'
)

const producto = productosGuardados.find(
  (producto: { id: number }) => producto.id === Number(id)
)

 const [nombre, setNombre] = useState(producto?.nombre || '')
const [descripcion, setDescripcion] = useState(producto?.descripcion || '')
const [precio, setPrecio] = useState(producto?.precio?.toString() || '')
const [imagen, setImagen] = useState(producto?.imagen || '')
const [disponible, setDisponible] = useState(producto?.disponible ?? true)

  return (
  <main className="p-8">
    <h1 className="text-3xl font-bold mb-6">
      Editar producto
    </h1>

    <form className="max-w-xl flex flex-col gap-4"  onSubmit={(e) => {
    e.preventDefault()

    const productosActualizados = productosGuardados.map(
      (producto: any) =>
        producto.id === Number(id)
          ? {
              ...producto,
              nombre,
              descripcion,
              precio: Number(precio),
              imagen,
              disponible,
            }
          : producto
    )

    localStorage.setItem(
      'productos',
      JSON.stringify(productosActualizados)
    )
    navigate('/admin/productos')
  }}>
      <div>
        <label>Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label>Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label>Precio</label>
        <input
          type="number"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          className="w-full border rounded p-2"
        />
      </div>

      <div>
        <label>Imagen</label>
        <input
          type="text"
          value={imagen}
          onChange={(e) => setImagen(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="URL de la imagen"
        />
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={disponible}
            onChange={(e) => setDisponible(e.target.checked)}
          />
          {' '}Disponible
        </label>
      </div>

      <button
        type="submit"
        className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Guardar cambios
      </button>
    </form>
  </main>
)
}