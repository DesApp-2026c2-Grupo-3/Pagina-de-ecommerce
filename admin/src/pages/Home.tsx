import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import type { AdministradorSesion } from '../types/sesion.types'
import { iniciarSesion as iniciarSesionApi } from '../services/authService'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const navigate = useNavigate()
  const { iniciarSesion } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  return (
    <main className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: "url('fondo1.jpg')" }}>

      <div className="w-full max-w-md bg-orange-200 p-8 m-2 rounded-lg shadow-md border-orange-500 border-4">
        <h1 className="text-3xl font-bold text-center mb-2">
          Administración
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Iniciá sesión para continuar
        </p>

        <form
          className="flex flex-col gap-5"
          onSubmit={async (e) => {
            e.preventDefault()

            try {
              const administrador = await iniciarSesionApi(email, password)

              const sesion: AdministradorSesion = {
                id: administrador.id,
                nombre: administrador.nombre,
                email: administrador.email,
                rol: administrador.rol,
                sucursalId: administrador.sucursalId ?? null,
                sucursal: administrador.sucursal ?? null,
              }

              iniciarSesion(sesion)
              navigate('/admin')
            } catch {
              setError('Email o contraseña incorrectos')
            }
          }}
        >
          {error && (
            <p className="text-center text-danger text-md mt-2 p-2 border-b border-t">
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
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              type="email"
              placeholder="admin@ejemplo.com"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="bg-orange-600 text-white rounded-md py-2 font-medium hover:bg-orange-700"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </main>
  )
}
