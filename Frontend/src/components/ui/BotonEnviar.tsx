interface Props {
  cargando: boolean
  texto: string
  textoCargando: string
}

// Botón principal de un formulario (rojo, ancho completo)
function BotonEnviar({ cargando, texto, textoCargando }: Props) {
  return (
    <button
      type="submit"
      disabled={cargando}
      className="mt-2 min-h-12 rounded-full bg-brand-red px-6 font-bold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-50"
    >
      {cargando ? textoCargando : texto}
    </button>
  )
}

export default BotonEnviar