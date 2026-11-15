
import { Bike, PackageCheck, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../../components/login/LoginForm'

export default function Login() {
  const { login } = useAuth()

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-white p-4 sm:p-6">

      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative grid w-full max-w-4xl overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-2xl shadow-orange-200/40 md:grid-cols-2">

        {/* Panel informativo: solo escritorio */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-9 text-white md:flex">

          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[30px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-orange-400/30 blur-2xl" />

          <div className="relative z-10">
            <div className="mb-9 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur-sm">
              <Bike size={30} />
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-100">
              Panel de repartidores
            </p>

            <h1 className="text-3xl font-extrabold leading-tight">
              Cada entrega cuenta.
              <span className="mt-1 block text-orange-100">
                Cada recorrido importa.
              </span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/85">
              Accedé a tus pedidos, organizá tus entregas y mantené el control
              de cada recorrido.
            </p>
          </div>

          <div className="relative z-10 mt-10 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <PackageCheck size={27} className="shrink-0" />

            <div>
              <p className="text-sm font-bold">
                Tus entregas, organizadas
              </p>
              <p className="mt-1 text-xs text-orange-100">
                Todo lo que necesitás en un solo lugar.
              </p>
            </div>
          </div>

          {/* Decoración */}
          <MapPin className="absolute bottom-28 right-10 text-white/10" size={100} />
        </section>

        {/* Formulario */}
        <section className="flex flex-col justify-center p-7 sm:p-10 md:p-12">

          {/* Logo visible en celular */}
          <div className="mb-7 flex items-center gap-3 md:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200">
              <Bike size={26} />
            </div>
            <div>
              <p className="font-extrabold text-slate-800">
                Panel de repartidores
              </p>
              <p className="text-xs text-slate-400">
                Gestión de entregas
              </p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-600">
              Acceso al sistema
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800">
              ¡Bienvenido!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ingresá con tu cuenta de repartidor para continuar.
            </p>
          </div>

          <LoginForm onSubmit={login} />

          <div className="mt-8 border-t border-orange-100 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Acceso exclusivo para repartidores registrados.
            </p>
          </div>
        </section>

      </div>
    </main>
  )
}
