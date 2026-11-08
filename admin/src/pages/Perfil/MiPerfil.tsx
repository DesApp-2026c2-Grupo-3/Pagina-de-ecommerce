import { useEffect, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { cambiarPassword, obtenerPerfil } from '../../services/perfilService'
import type { Perfil } from '../../types/notificacion.types'

const ROL_TEXTO = { MASTER: 'Administrador general', ADMIN: 'Encargado', EMPLEADO: 'Empleado' } as const
const filaClase = 'flex flex-col gap-1 border-b border-gray-200 py-3 last:border-b-0 sm:flex-row sm:gap-4'
const etiquetaClase = 'font-medium text-gray-700 sm:w-48 sm:shrink-0'
const campoClase = 'w-full rounded border p-2'

function validar(actual: string, nueva: string, repetir: string): string {
  if (!actual) return 'Ingresá tu contraseña actual.'
  if (nueva.length < 8 || nueva.length > 20) return 'La contraseña nueva debe tener entre 8 y 20 caracteres.'
  if (!/^(?=.*[A-Z])(?=.*[0-9])/.test(nueva)) return 'La contraseña nueva debe tener al menos una mayúscula y un número.'
  if (nueva !== repetir) return 'Las contraseñas nuevas no coinciden.'
  if (nueva === actual) return 'La contraseña nueva tiene que ser distinta de la actual.'
  return ''
}

export default function MiPerfil() {
  const { mostrarToast } = useToast()
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [error, setError] = useState('')

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetir, setRepetir] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    obtenerPerfil()
      .then(setPerfil)
      .catch(() => setError('No se pudo cargar tu perfil.'))
  }, [])

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const mensaje = validar(actual, nueva, repetir)
    if (mensaje) {
      setErrorPassword(mensaje)
      return
    }
    setGuardando(true)
    setErrorPassword('')
    try {
      await cambiarPassword(actual, nueva)
      setActual('')
      setNueva('')
      setRepetir('')
      mostrarToast('Contraseña actualizada')
    } catch (err) {
      setErrorPassword(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <main className="p-4 md:p-8">
      <h1 className="text-3xl font-bold">Mi perfil</h1>
      <p className="mt-2 mb-6 text-gray-600">Tus datos y tu contraseña.</p>

      {error && <p className="text-red-600">{error}</p>}
      {!perfil && !error && <p className="text-gray-600">Cargando...</p>}

      {perfil && (
        <div className="flex max-w-3xl flex-col gap-6">
          <section className="rounded-lg border bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center gap-4">
              <span className="flex size-14 items-center justify-center rounded-full bg-gray-800 text-2xl font-semibold text-white">
                {perfil.nombre.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xl font-semibold">{perfil.nombre}</p>
                <p className="text-gray-600">{ROL_TEXTO[perfil.rol]}</p>
              </div>
            </div>

            <div className={filaClase}>
              <span className={etiquetaClase}>Email</span>
              <span className="break-all">{perfil.email}</span>
            </div>
            <div className={filaClase}>
              <span className={etiquetaClase}>Sucursal</span>
              <span>{perfil.sucursal?.nombre ?? 'Todas (administración general)'}</span>
            </div>
            {perfil.rol !== 'MASTER' && (
              <div className={filaClase}>
                <span className={etiquetaClase}>{perfil.rol === 'ADMIN' ? 'Encargados de la sucursal' : 'Tus encargados'}</span>
                <span>{perfil.encargados.length > 0 ? perfil.encargados.map((e) => e.nombre).join(', ') : 'Sin encargados activos'}</span>
              </div>
            )}
            <div className={filaClase}>
              <span className={etiquetaClase}>Cuenta creada</span>
              <span>{new Date(perfil.desde).toLocaleDateString('es-AR')}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500">Tu nombre y tu email los gestiona quien te dio de alta.</p>
          </section>

          <section className="rounded-lg border bg-white p-4 shadow-sm md:p-6">
            <h2 className="mb-4 text-xl font-semibold">Cambiar contraseña</h2>
            <form onSubmit={guardar} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block font-medium" htmlFor="pass-actual">Contraseña actual</label>
                <input id="pass-actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => { setActual(e.target.value); setErrorPassword('') }} className={campoClase} />
              </div>
              <div>
                <label className="mb-1 block font-medium" htmlFor="pass-nueva">Contraseña nueva</label>
                <input id="pass-nueva" type="password" autoComplete="new-password" maxLength={20} value={nueva} onChange={(e) => { setNueva(e.target.value); setErrorPassword('') }} className={campoClase} />
                <p className="mt-1 text-xs text-gray-500">De 8 a 20 caracteres, con al menos una mayúscula y un número.</p>
              </div>
              <div>
                <label className="mb-1 block font-medium" htmlFor="pass-repetir">Repetir la contraseña nueva</label>
                <input id="pass-repetir" type="password" autoComplete="new-password" maxLength={20} value={repetir} onChange={(e) => { setRepetir(e.target.value); setErrorPassword('') }} className={campoClase} />
              </div>
              {errorPassword && <p className="text-sm text-red-600">{errorPassword}</p>}
              <div>
                <button type="submit" disabled={guardando} className="rounded border border-black bg-action px-4 py-2 text-white hover:bg-action-hover disabled:opacity-50">
                  {guardando ? 'Guardando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
