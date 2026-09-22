import { useNavigate } from 'react-router-dom'
import type { AdministradorSesion } from '../App'
import { useState } from 'react';
import { iniciarSesion } from '../services/auth';

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

      <form className="flex flex-col gap-5" 
      onSubmit={async (e) => {
        e.preventDefault()

        try {
          const administrador = await iniciarSesion(email, password)

          setAdministrador({
            nombre: administrador.nombre,
            email: administrador.email,
            rol: administrador.rol,
          })

          localStorage.setItem(
            'administrador',
              JSON.stringify({
                nombre: administrador.nombre,
                email: administrador.email,
                rol: 'MASTER',
              })
          )

          navigate('/admin')
        } catch (error) {
          setError('Email o contraseña incorrectos')
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