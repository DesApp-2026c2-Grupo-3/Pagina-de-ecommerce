import { useEffect, type RefObject } from 'react'

// El estado manda sobre el <dialog> nativo: showModal() da capa superior, fondo inerte,
// foco atrapado y Escape. Al abrir, el foco va al elemento indicado.
export function useDialogoModal(
  dialogo: RefObject<HTMLDialogElement | null>,
  abierto: boolean,
  focoInicial: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return

    if (abierto && !elemento.open) {
      elemento.showModal()
      focoInicial.current?.focus()
    }
    if (!abierto && elemento.open) elemento.close()
  }, [abierto, dialogo, focoInicial])
}
