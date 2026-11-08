import { Bike, PackageCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import LoginForm from '../../components/login/LoginForm'

export default function Login() {
  const { login } = useAuth()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">

        <section className="relative flex flex-col justify-between overflow-hidden bg-slate-900 p-8 text-white md:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />

          <div className="relative">
            <div className="mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500">
              <Bike size={30} />
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-orange-400">
              Panel de repartidores
            </p>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              Cada entrega cuenta.
              <span className="text-orange-400"> Cada recorrido importa.</span>
            </h1>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Accedé a tus pedidos, organizá tus entregas y mantené el control
              de cada recorrido.
            </p>
          </div>

          <div className="relative mt-12 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <PackageCheck className="text-orange-400" size={28} />
            <div>
              <p className="text-sm font-semibold">Tus entregas, organizadas</p>
              <p className="text-xs text-slate-400">
                Todo lo que necesitás en un solo lugar.
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">
              ¡Bienvenido!
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresá con tu cuenta de repartidor para continuar.
            </p>
          </div>

          <LoginForm onSubmit={login} />

          <p className="mt-8 text-center text-xs text-slate-400">
            Acceso exclusivo para repartidores registrados.
          </p>
        </section>
      </div>
    </main>
  )
}