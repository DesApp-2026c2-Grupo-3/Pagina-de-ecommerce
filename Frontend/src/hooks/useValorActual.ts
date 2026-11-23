import { useEffect, useRef } from 'react'

// Ref con el último valor renderizado: las funciones estables lo leen sin depender de él
export function useValorActual<T>(valor: T) {
  const ref = useRef(valor)

  useEffect(() => {
    ref.current = valor
  }, [valor])

  return ref
}
