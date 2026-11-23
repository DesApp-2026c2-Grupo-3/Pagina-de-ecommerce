import { useMemo } from 'react'
import { CircleAlert } from 'lucide-react'

import { useToast } from '../context/toasts/ToastContext'

// Errores de las acciones de las pantallas (retirar, entregar, iniciar…): el repartidor sabe lo
// que hizo, pero no puede saber que falló. Las acciones que salen bien no se anuncian (v1.6).
// El id sale del título, así que repetir el mismo error no apila toasts iguales.
export function useAvisoAccion() {
  const { mostrar } = useToast()

  return useMemo(
    () => ({
      // El mensaje del servidor, si lo hay, va como descripción ("El pedido ya fue tomado")
      error: (titulo: string, error: unknown) =>
        mostrar({
          id: `error-${titulo}`,
          tono: 'peligro',
          icono: CircleAlert,
          titulo,
          descripcion: error instanceof Error && error.message ? error.message : undefined,
          prioridad: 'alta',
        }),
    }),
    [mostrar],
  )
}
