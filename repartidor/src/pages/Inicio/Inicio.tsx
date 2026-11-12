
import { ClipboardList, MapPinned, History, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const accesos = [
  {
    titulo: 'Pedidos disponibles',
    descripcion: 'Consultá los pedidos pendientes de reparto de tu sucursal.',
    ruta: '/pedidos',
    icono: ClipboardList,
  },
  {
    titulo: 'Mi viaje',
    descripcion: 'Consultá y administrá tu recorrido de entregas.',
    ruta: '/viaje',
    icono: MapPinned,
  },
  {
    titulo: 'Historial',
    descripcion: 'Revisá tus recorridos y entregas anteriores.',
    ruta: '/historial',
    icono: History,
  },
]

export default function Inicio() {
  const { repartidor } = useAuth()

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-orange-600">
          Panel de repartidor
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
          ¡Hola, {repartidor?.nombre}!
        </h2>

        <p className="mt-2 text-sm text-slate-500 sm:text-base">
          ¿Listo para comenzar tu jornada? Desde acá podés organizar tus entregas.
        </p>
      </section>

      <section className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="max-w-xl">
          <span className="text-sm font-medium text-orange-400">
            Tu jornada
          </span>

          <h3 className="mt-2 text-xl font-bold sm:text-2xl">
            Cada pedido cuenta.
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            Consultá los pedidos disponibles y organizá tus entregas en un solo lugar.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          Accesos rápidos
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accesos.map(({ titulo, descripcion, ruta, icono: Icono }) => (
            <Link
              key={ruta}
              to={ruta}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icono size={24} />
                </div>

                <ArrowRight
                  size={20}
                  className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                />
              </div>

              <h4 className="mt-5 font-bold text-slate-900">
                {titulo}
              </h4>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {descripcion}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
