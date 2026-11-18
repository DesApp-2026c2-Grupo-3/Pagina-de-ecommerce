
import {
  ClipboardList,
  MapPinned,
  History,
  ArrowUpRight,
  Zap,
  Bike,
  PackageCheck,
} from 'lucide-react'

import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const accesos = [
  {
    titulo: 'Pedidos disponibles',
    descripcion: 'Descubrí los pedidos listos para retirar en tu sucursal.',
    detalle: 'TU PRÓXIMA ENTREGA',
    ruta: '/pedidos',
    icono: ClipboardList,
    color: 'from-orange-500 to-amber-400',
    fondo: 'bg-orange-50',
    texto: 'text-orange-700',
    numero: '01',
  },
  {
    titulo: 'Mi viaje',
    descripcion: 'Organizá tu recorrido y gestioná tus entregas activas.',
    detalle: 'EN MOVIMIENTO',
    ruta: '/viaje',
    icono: MapPinned,
    color: 'from-orange-500 to-amber-400',
    fondo: 'bg-orange-50',
    texto: 'text-orange-700',
    numero: '02',
  },
  {
    titulo: 'Historial',
    descripcion: 'Consultá tus recorridos y revisá tus entregas anteriores.',
    detalle: 'TUS RECORRIDOS',
    ruta: '/historial',
    icono: History,
    color: 'from-orange-500 to-amber-400',
    fondo: 'bg-orange-50',
    texto: 'text-orange-700',
    numero: '03',
  },
]

export default function Inicio() {
  const { repartidor } = useAuth()

  return (
    <div className="space-y-9">

      {/* ENCABEZADO */}
      <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-orange-100/70 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-orange-700">
                Panel de repartidor
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              ¡Hola, {repartidor?.nombre}!
              <span className="ml-2 inline-block">👋</span>
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
              Tu próxima entrega está a un paso. Organizá tus pedidos,
              prepará tu recorrido y salí a repartir.
            </p>
          </div>

          <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-orange-100 text-orange-500 sm:flex">
            <Bike size={52} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* ACCESOS */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-700">
              Centro de operaciones
            </p>
            <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
              ¿A dónde vamos?
            </h3>
          </div>

          <p className="text-sm text-slate-500">
            Elegí una sección para continuar
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {accesos.map(({ titulo, descripcion, ruta, icono: Icono, color, fondo, texto, numero, detalle }) => (
            <Link
              key={ruta}
              to={ruta}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-orange-200 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${fondo} ${texto} transition duration-300 group-hover:scale-110`}>
                  <Icono size={27} strokeWidth={1.8} />
                </div>

                {/* Número decorativo (v1.13): va como contenido generado y oculto para el lector de pantalla,
                    porque es pura decoración y no tiene que cumplir contraste (WCAG 1.4.3). */}
                <span
                  aria-hidden="true"
                  data-numero={numero}
                  className="text-3xl font-black tracking-tighter text-slate-100 transition before:content-[attr(data-numero)] group-hover:text-orange-100"
                />
              </div>

              <p className={`mt-7 text-[10px] font-extrabold tracking-[0.18em] ${texto}`}>
                {detalle}
              </p>

              <h4 className="mt-2 text-xl font-black tracking-tight text-slate-900">
                {titulo}
              </h4>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                {descripcion}
              </p>

              <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm font-bold text-slate-700 transition group-hover:text-orange-700">
                  Explorar sección
                </span>

                <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white shadow-md transition duration-300 group-hover:rotate-45 group-hover:scale-110`}>
                  <ArrowUpRight size={19} />
                </div>
              </div>

              <div className={`absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${color} opacity-0 blur-3xl transition duration-500 group-hover:opacity-15`} />
            </Link>
          ))}
        </div>
      </section>

       {/* BANNER PRINCIPAL */}
      <section className="relative isolate overflow-hidden rounded-[2rem] 
      bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 p-7 text-white shadow-xl sm:p-10">

        {/* Decoración */}
        <div className="absolute -right-16 -top-24 -z-10 h-80 w-80 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 -z-10 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">

          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-3 py-1.5">
              <Zap size={14} className="text-orange-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-orange-700">
                Tu jornada comienza acá
              </span>
            </div>

            <h3 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-800 sm:text-5xl">
              Cada entrega
              <span className="block text-orange-600">
                cuenta.
              </span>
            </h3>

            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
              Todo lo que necesitás para llevar tus pedidos a destino.
              Prepará tu recorrido y hacé que cada entrega sea un éxito.
            </p>
          </div>

          <div className="relative flex h-44 w-full max-w-xs items-center justify-center self-center lg:h-52">
  {/* Círculos decorativos */}
            <div className="absolute h-40 w-40 rounded-full border border-orange-500/20" />
            <div className="absolute h-32 w-32 rounded-full border border-orange-500/30" />

  {/* Círculo central */}
            <div className="absolute h-24 w-24 rounded-full bg-gradient-to-br 
            from-orange-500 to-amber-500 shadow-[0_0_50px_rgba(249,115,22,0.3)]" />

  {/* Bicicleta */}
            <Bike size={76}
              strokeWidth={1.3} 
              className="relative z-10 text-white"
            />

  {/* Icono de pedidos */}
            <div className="absolute right-4 top-4 rounded-2xl border border-orange-200
              bg-white/80 p-3 shadow-md backdrop-blur-md">
              <PackageCheck size={24} className="text-orange-600" />
            </div>

          </div>

        </div>

  {/* Pie del banner */}
              <div className="relative mt-8 flex items-center gap-3 border-t border-orange-200 pt-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-600">
                  <Zap size={18} />
                </div>

                <p className="text-xs font-medium text-slate-600 sm:text-sm">
                  Tu compromiso mueve cada pedido.
                </p>
              </div>
      </section>

    </div>
  )
}
