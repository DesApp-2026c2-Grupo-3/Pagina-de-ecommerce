import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NuevoProducto() {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [imagen, setImagen] = useState('');
    const [disponible, setDisponible] = useState(true);
    const navigate = useNavigate();

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Nuevo producto
      </h1>

      <form className="max-w-xl flex flex-col gap-4" 
      onSubmit={(e) => {
        e.preventDefault()
        const producto = {
            id: Date.now(),
            nombre,
            descripcion,
            precio: Number(precio),
            imagen,
            disponible,
        }
        const productosGuardados = JSON.parse(
            localStorage.getItem('productos') || '[]'
        )
        
        productosGuardados.push(producto)

        localStorage.setItem(
            'productos',
            JSON.stringify(productosGuardados)
        )
        
        console.log(producto)

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
          <input type="number" 
          value={precio} 
          onChange={(e) => setPrecio(e.target.value)} 
          className="w-full border rounded p-2" />
        </div>

        <div>
          <label>Imagen</label>
          <input type="text" 
          value={imagen} 
          onChange={(e) => setImagen(e.target.value)} 
          className="w-full border rounded p-2" 
          placeholder="URL de la imagen"/>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={disponible}
              onChange={(e) => setDisponible(e.target.checked)}/>
              {' '}Disponible
          </label>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Crear producto
        </button>
      </form>
    </main>
  )
}