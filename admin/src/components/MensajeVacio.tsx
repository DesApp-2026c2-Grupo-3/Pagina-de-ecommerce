interface MensajeVacioProps {
  mensaje: string
}

export default function MensajeVacio({
  mensaje,
}: MensajeVacioProps) {
  return (
    <div className="bg-secondary border border-2 border-slate-700 
    rounded-lg p-8 text-center shadow-xl">
      <p className="text-white text-xl font-bold">
        {mensaje}
      </p>
    </div>
  )
}