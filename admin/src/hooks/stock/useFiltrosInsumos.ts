import { useCallback, useEffect, useRef, useState } from 'react'
import { DURACION_RESALTADO_INSUMO_MS } from '../../config/stock'
import type { ItemStock } from '../../types/stock.types'
import { enAlerta } from '../../utils/stock/estadoInsumo'
import type { FiltroEstadoStock } from '../../utils/stock/filtrarStock'
import { useStockDeepLink } from '../useStockDeepLink'

interface Opciones {
  sucursalId: number
  stock: ItemStock[]
  stockCargadoPara: number | null
  onAlerta: (items: ItemStock[]) => void
}

// Filtros de la vista Insumos + el aviso de stock bajo (?buscar=<insumo>, RN-43).
// La lógica del aviso se movió tal cual estaba en Stock.tsx (plan de Stock, E2):
// filtra y resalta ese insumo; al salir del enlace, vuelve a mostrar los insumos en alerta.
export function useFiltrosInsumos({ sucursalId, stock, stockCargadoPara, onAlerta }: Opciones) {
  const { nombreBuscado: nombreDeepLink, claveNavegacion, limpiarBusqueda } = useStockDeepLink()

  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoStock>('todos')
  const [pagina, setPagina] = useState(1)
  const [insumoResaltadoId, setInsumoResaltadoId] = useState<number | null>(null)
  const [insumoObjetivoId, setInsumoObjetivoId] = useState<number | null>(null)

  const aplicacionRef = useRef<string | null>(null)
  const nombreDeepLinkRef = useRef(nombreDeepLink)
  const nombreAnteriorRef = useRef<string | null>(null)
  const limpiezaManualRef = useRef(false)
  const onAlertaRef = useRef(onAlerta)

  useEffect(() => {
    nombreDeepLinkRef.current = nombreDeepLink
    onAlertaRef.current = onAlerta
  })

  // Otra sucursal: se olvida el insumo del aviso anterior
  const [sucursalMostrada, setSucursalMostrada] = useState(sucursalId)
  if (sucursalMostrada !== sucursalId) {
    setSucursalMostrada(sucursalId)
    setInsumoObjetivoId(null)
    setInsumoResaltadoId(null)
  }
  useEffect(() => {
    aplicacionRef.current = null
  }, [sucursalId])

  useEffect(() => {
    if (nombreDeepLink === null) {
      const veniaDeDeepLink = nombreAnteriorRef.current !== null
      const fueLimpiezaManual = limpiezaManualRef.current

      nombreAnteriorRef.current = null
      limpiezaManualRef.current = false
      aplicacionRef.current = null
      setInsumoObjetivoId(null)
      setInsumoResaltadoId(null)

      if (veniaDeDeepLink && !fueLimpiezaManual) {
        setBusqueda('')
        setFiltroEstado('todos')
        setPagina(1)

        const enRiesgo = stock.filter(enAlerta)
        if (enRiesgo.length > 0) onAlertaRef.current(enRiesgo)
      }
      return
    }

    nombreAnteriorRef.current = nombreDeepLink

    if (stockCargadoPara !== sucursalId) return
    if (aplicacionRef.current === claveNavegacion) return

    const item = stock.find((dato) => dato.nombre.trim() === nombreDeepLink)

    aplicacionRef.current = claveNavegacion
    if (!item) {
      limpiarBusqueda()
      return
    }

    setBusqueda(item.nombre)
    setFiltroEstado('todos')
    setInsumoObjetivoId(item.id)
    setPagina(1)
    setInsumoResaltadoId(item.id)
    onAlertaRef.current([])
  }, [claveNavegacion, limpiarBusqueda, nombreDeepLink, stock, stockCargadoPara, sucursalId])

  useEffect(() => {
    if (insumoResaltadoId === null) return
    const timer = window.setTimeout(() => setInsumoResaltadoId(null), DURACION_RESALTADO_INSUMO_MS)
    return () => window.clearTimeout(timer)
  }, [insumoResaltadoId])

  // El usuario toca un filtro: se suelta el insumo del aviso
  const liberarDeepLink = useCallback(() => {
    if (nombreDeepLinkRef.current !== null) {
      limpiezaManualRef.current = true
      limpiarBusqueda()
    }
    setInsumoObjetivoId(null)
    setInsumoResaltadoId(null)
  }, [limpiarBusqueda])

  const cambiarBusqueda = useCallback(
    (valor: string) => {
      setBusqueda(valor)
      setPagina(1)
      liberarDeepLink()
    },
    [liberarDeepLink],
  )

  const cambiarFiltroEstado = useCallback(
    (valor: FiltroEstadoStock) => {
      setFiltroEstado(valor)
      setPagina(1)
      liberarDeepLink()
    },
    [liberarDeepLink],
  )

  // «Ver en la lista» de la alerta de stock bajo
  const mostrarEnAlerta = useCallback(
    (items: ItemStock[]) => {
      liberarDeepLink()
      setBusqueda('')
      setPagina(1)
      setFiltroEstado(items.every((i) => i.cantidad <= 0) ? 'sin' : 'bajo')
    },
    [liberarDeepLink],
  )

  // Para la carga inicial: si se entró por un aviso, no se muestra la alerta general
  const hayDeepLink = useCallback(() => nombreDeepLinkRef.current !== null, [])

  return {
    busqueda,
    filtroEstado,
    pagina,
    setPagina,
    insumoResaltadoId,
    insumoObjetivoId,
    cambiarBusqueda,
    cambiarFiltroEstado,
    mostrarEnAlerta,
    hayDeepLink,
  }
}
