// Foto de fondo del slide a todo color. El degradé oscuro solo cubre la izquierda, donde va el texto.
function SlideBackdrop({ imagen }: { imagen: string }) {
  return (
    <>
      <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/90 via-brand-dark/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand-dark/60 to-transparent" />
    </>
  )
}

export default SlideBackdrop