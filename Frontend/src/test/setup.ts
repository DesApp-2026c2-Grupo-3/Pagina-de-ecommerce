import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom no implementa showModal/close de <dialog>: lo mínimo para abrir y cerrar en los tests.
// (En el navegador real se prueba el comportamiento nativo: foco, Escape, fondo inerte y capa superior.)
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// jsdom tampoco implementa matchMedia: se evalúan los anchos (min/max-width en px o rem)
// contra window.innerWidth, que los tests pueden cambiar con vi.stubGlobal.
if (!window.matchMedia) {
  window.matchMedia = (consulta: string) => {
    const evaluar = () => {
      const partes = consulta.match(/\((min|max)-width:\s*([\d.]+)(px|rem)\)/)
      if (!partes) return false
      const ancho = Number(partes[2]) * (partes[3] === 'rem' ? 16 : 1)
      return partes[1] === 'min' ? window.innerWidth >= ancho : window.innerWidth <= ancho
    }

    return {
      get matches() {
        return evaluar()
      },
      media: consulta,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    } as MediaQueryList
  }
}

// Después de cada test, se borra lo que se dibujó
afterEach(() => {
  cleanup()
})
