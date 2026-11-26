// Notas de cocina que dejó el cliente al confirmar
export default function ObservacionesPedido({
  observaciones,
}: {
  observaciones: string | null | undefined
}) {
  if (!observaciones?.trim()) return null

  return (
    <section
      aria-labelledby="titulo-observaciones"
      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3"
    >
      <h2 id="titulo-observaciones" className="font-bold text-amber-900">
        Observaciones del cliente
      </h2>
      <p className="mt-1 whitespace-pre-wrap break-words text-sm text-amber-900">
        {observaciones}
      </p>
    </section>
  )
}
