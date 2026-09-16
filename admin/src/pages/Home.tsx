import { useNavigate } from 'react-router-dom'

interface HomeProps {
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>
}

export default function Home({setIsAuthenticated}:HomeProps) {
    const navigate = useNavigate()

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center mb-2">
          Administración
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Iniciá sesión para continuar
        </p>

       

        <form className="flex flex-col gap-5" onSubmit={(e) => {
            e.preventDefault()
            setIsAuthenticated(true)
            navigate('/admin')
        }}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-medium">
              Correo electrónico
            </label>

            <input
              id="email"
              type="email"
              placeholder="admin@ejemplo.com"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-medium">
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  )
}