import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useToast } from '../../context/ToastContext'
import { actualizarInsumo, crearInsumo } from '../../services/insumoService'
import type { Insumo } from '../../types/insumo.types'
import {
  FORMULARIO_INSUMO_VACIO,
  datosDesdeFormulario,
  formularioDesdeInsumo,
  validarFormularioInsumo,
  type FormularioInsumo,
} from '../../utils/insumos/formularioInsumo'
import { desplazarSuave } from '../../utils/navegacion/desplazarSuave'

// Formulario compartido de crear / editar insumo, con la misma lógica de hoy. Al editar,
// sube despacio hasta el formulario (~700 ms) y el cursor empieza en Nombre (plan v3, D-I3).
export function useFormularioInsumo(setError: (mensaje: string) => void, onGuardado: () => void) {
  const { mostrarToast } = useToast()
  const [form, setForm] = useState<FormularioInsumo>(FORMULARIO_INSUMO_VACIO)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [guardando, setGuardando] = useState(false)
  const refFormulario = useRef<HTMLFormElement | null>(null)
  const refNombre = useRef<HTMLInputElement | null>(null)
  const cancelarDesplazamiento = useRef<() => void>(() => {})

  // Si se sale de la página a mitad de camino, se corta la animación
  useEffect(() => () => cancelarDesplazamiento.current(), [])

  function cambiar(campo: keyof FormularioInsumo, valor: string) {
    setForm((previo) => ({ ...previo, [campo]: valor }))
    setError('')
  }

  function editar(insumo: Insumo) {
    setEditandoId(insumo.id)
    setForm(formularioDesdeInsumo(insumo))
    setError('')
    // Después del render con los datos cargados
    window.requestAnimationFrame(() => {
      cancelarDesplazamiento.current()
      if (refFormulario.current) cancelarDesplazamiento.current = desplazarSuave(refFormulario.current)
      refNombre.current?.focus({ preventScroll: true })
    })
  }

  function cancelar() {
    setEditandoId(null)
    setForm(FORMULARIO_INSUMO_VACIO)
    setError('')
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    const problema = validarFormularioInsumo(form)
    if (problema) {
      setError(problema)
      return
    }
    const datos = datosDesdeFormulario(form)
    setGuardando(true)
    try {
      if (editandoId) {
        await actualizarInsumo(editandoId, datos)
        mostrarToast('Insumo modificado!')
      } else {
        await crearInsumo(datos)
        mostrarToast('Insumo creado!')
      }
      cancelar()
      onGuardado()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el insumo.')
    } finally {
      setGuardando(false)
    }
  }

  return { form, editandoId, guardando, refFormulario, refNombre, cambiar, editar, cancelar, guardar }
}
