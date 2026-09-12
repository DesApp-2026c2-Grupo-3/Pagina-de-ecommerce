import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NuevoProducto() {
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [imagen, setImagen] = useState('');
    const [disponible, setDisponible] = useState(true);
    const [categoriaId, setCategoriaId] = useState('');
    const [errorNombre, setErrorNombre] = useState('');
    const [errorDescripcion, setErrorDescripcion] = useState('');
    const [errorPrecio, setErrorPrecio] = useState('');
    const [errorImagen, setErrorImagen] = useState('');
    const navigate = useNavigate();

    const categorias = JSON.parse(
      localStorage.getItem('categorias') || '[]'
    )

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Nuevo producto
      </h1>

      <form className="max-w-xl flex flex-col gap-4" 
      onSubmit={(e) => {
        e.preventDefault()
        setErrorNombre('')
        setErrorDescripcion('')
        setErrorPrecio('')
        setErrorImagen('')

        let hayErrores = false

        if (nombre.trim().length < 3) {
          setErrorNombre('El nombre debe tener al menos 3 caracteres.')
          hayErrores = true
        }

        if (descripcion.trim().length < 15) {
          setErrorDescripcion(
            'La descripción debe tener al menos 15 caracteres.'
          )
          hayErrores = true
        }

        if(Number(precio) <= 0 || precio === ''){
          setErrorPrecio(
            'El precio debe ser mayor a 0'
          )
          hayErrores = true
        }

        if(Number(precio) > 999999){
          setErrorPrecio(
            'El precio no puede ser mayor a 999999'
          )
          hayErrores = true
        }

        if(imagen.trim().length < 1){
          setErrorImagen(
            'El campo imagen no puede estar vacio'
          )
          hayErrores = true
        }

        
        if (hayErrores) {
          return
        }

        const producto = {
            id: Date.now(),
            nombre,
            descripcion,
            precio: Number(precio),
            imagen,
            disponible,
            categoriaId: Number(categoriaId),
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
            maxLength={15}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Ej: Hamburguejas al vapor"
            />
        </div>

        {errorNombre && (
          <p className="text-red-600 text-sm mt-1">
            {errorNombre}
          </p>
        )}

        <div>
          <label>Descripción</label>
          <textarea
            value={descripcion}
            maxLength={100}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full border rounded p-2"
          />
        </div>

        {errorDescripcion && (
          <p className="text-red-600 text-sm mt-1">
            {errorDescripcion}
          </p>
        )}

        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Categoría
          </label>

          <select
          value={categoriaId}
          required
          onChange={(e) => setCategoriaId(e.target.value)}
          className="w-full border rounded px-3 py-2">

            <option value="">
              Seleccionar categoría
            </option>

            {categorias.map(
              (categoria: { id: number; nombre: string }) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre}
              </option>
              )
              )}
          </select>
        </div>

        <div>
          <label>Precio</label>
          <input type="number" 
          value={precio} 
          step="0.1"
          onChange={(e) => setPrecio(e.target.value)} 
          className="w-full border rounded p-2" />
        </div>

        {errorPrecio && (
          <p className="text-red-600 text-sm mt-1">
            {errorPrecio}
          </p>
        )}

        <div>
          <label>Imagen</label>
          <input type="text" 
          value={imagen} 
          onChange={(e) => setImagen(e.target.value)} 
          className="w-full border rounded p-2" 
          placeholder="URL de la imagen"/>
        </div>

        {errorImagen && (
          <p className="text-red-600 text-sm mt-1">
            {errorImagen}
          </p>
        )}

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
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Crear producto
        </button>
      </form>
    </main>
  )
}