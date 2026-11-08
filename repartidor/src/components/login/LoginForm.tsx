import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, LockKeyhole, Mail, LoaderCircle } from 'lucide-react'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const manejarSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Completá todos los campos.')
      return
    }

    try {
      setCargando(true)
      await onSubmit(email.trim(), password)
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : ''

      setError(
        mensaje === 'email-password-incorrectos'
          ? 'El correo o la contraseña son incorrectos.'
          : 'No se pudo iniciar sesión. Intentá nuevamente.',
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <form onSubmit={manejarSubmit} className="w-full space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Correo electrónico
        </label>

        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700">
          Contraseña
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

          <input
            type={mostrarPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresá tu contraseña"
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
          />

          <button
            type="button"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {mostrarPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3.5 font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {cargando ? (
          <>
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Ingresando...
          </>
        ) : (
          'Ingresar'
        )}
      </button>
    </form>
  )
}