import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// jsdom no implementa showModal/close de <dialog>: lo mínimo para abrir y cerrar en los tests.
// (En el navegador real se prueba el comportamiento nativo: foco, Escape y capa superior.)
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// jsdom tampoco implementa popover (los toasts usan popover="manual"), pero su hoja de estilos sí
// oculta todo [popover] que no esté abierto. Abrir = mostrarlo; cerrar = volver a ocultarlo.
if (!HTMLElement.prototype.showPopover) {
  HTMLElement.prototype.showPopover = function showPopover(this: HTMLElement) {
    this.style.display = 'block'
  }
  HTMLElement.prototype.hidePopover = function hidePopover(this: HTMLElement) {
    this.style.removeProperty('display')
  }
}

// Después de cada test, se borra lo que se dibujó
afterEach(() => {
  cleanup()
})
