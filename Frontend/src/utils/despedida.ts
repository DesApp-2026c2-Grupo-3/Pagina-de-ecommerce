// Aviso para mostrar la pantalla "Hasta pronto" desde cualquier lugar donde se cierre sesión
export const EVENTO_DESPEDIDA = 'bf:despedida'

export function anunciarDespedida(nombre: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENTO_DESPEDIDA, { detail: nombre }))
}