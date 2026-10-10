import type { ReactNode } from 'react'

interface Props {
  titulo: string
  subtitulo: string
  /** Texto debajo de la tarjeta (ej: "¿No tenés cuenta? Registrate") */
  pie: ReactNode
  children: ReactNode
}

// Pantalla de Login y Registro: en escritorio, panel oscuro con foto a la izquierda y formulario a la derecha
function AuthLayout({ titulo, subtitulo, pie, children }: Props) {
  return (
    <div className="grid min-h-[calc(100vh-5rem)] bg-brand-cream text-brand-dark lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-brand-dark lg:block">
        <img src="/homeImg/coso3.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 grayscale" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
        <div className="relative flex h-full flex-col justify-end gap-5 p-12 text-brand-cream">
          <span className="w-fit -rotate-3 rounded-full border-2 border-brand-dark bg-brand-mustard px-4 py-1.5 text-sm font-extrabold text-brand-dark">
            BurgerFast
          </span>
          <p className="font-display text-6xl font-extrabold leading-[0.9] tracking-tight">
            Pedí rápido,
            <br />
            comé <span className="text-brand-red">rico</span>.
          </p>
          <p className="max-w-sm text-brand-cream/75">Guardá tus direcciones, seguí tus pedidos y repetilos con un toque.</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">{titulo}</h1>
          <p className="mt-3 text-brand-muted">{subtitulo}</p>

          <div className="mt-8 rounded-[1.75rem] border-2 border-brand-dark bg-white p-6 shadow-sticker">{children}</div>

          <p className="mt-6 text-center text-sm text-brand-muted">{pie}</p>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout