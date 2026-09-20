import { useNavigate } from 'react-router-dom'
import type { AdministradorSesion } from '../App'
import { useState } from 'react';

interface HomeProps {
  setAdministrador: React.Dispatch<
    React.SetStateAction<AdministradorSesion | null>
  >
}

export default function Home({setAdministrador}:HomeProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
  <main className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="w-full max-w-md bg-white p-8 m-2 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-center mb-2">
          Administración
      </h1>

      <p className="text-gray-500 text-center mb-8">
          Iniciá sesión para continuar
      </p>

      <form className="flex flex-col gap-5" onSubmit={(e) => {
        e.preventDefault()

        if (email === 'manolo@admin.com' && password === 'admin123') {
          const administrador = {
            nombre: 'Manolo',
            email: 'manolo@admin.com',
            rol: 'MASTER' as const,
          }

          setAdministrador(administrador);

          localStorage.setItem(
            'administrador',
            JSON.stringify(administrador)
          )

          navigate('/admin')
        }else{
          setError('Ingrese su email y contraseña')
        }
      }}>
        {error && (
        <p className="text-center text-danger text-md mt-2
         p-2 border-b border-t">
          {error}
        </p>
      )}

        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium">
              Correo electrónico
          </label>

          <input
            id="email"
            value={email}
            onChange={(e) => {setEmail(e.target.value); setError('')}}
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
            value={password}
            onChange={(e)=> {setPassword(e.target.value); setError('')}}
            placeholder="••••••••"
            className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700">
            Iniciar sesión
        </button>
      </form>

    </div>
  </main>
  )
}