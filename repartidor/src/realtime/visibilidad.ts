// W-1 (plan UX): con la pantalla bloqueada o la pestaña en segundo plano el navegador del
// celular suspende la página y corta el socket. No se intenta mantenerlo vivo: al volver a
// primer plano se avisa para que la app recargue sus datos de inmediato.
export function escucharRegresoAPrimerPlano(alVolver: () => void): () => void {
  const alCambiar = () => {
    if (document.visibilityState === 'visible') alVolver()
  }

  document.addEventListener('visibilitychange', alCambiar)
  return () => document.removeEventListener('visibilitychange', alCambiar)
}
