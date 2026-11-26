import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { obtenerStockPorSucursal, registrarBaja } from '../../services/stockService'
import { obtenerSucursalPorId } from '../../services/sucursalService'
import type { ItemStock } from '../../types/stock.types'
import { FORM_BAJA_VACIO, validarBaja, type FormBaja } from '../../utils/stock/baja'
import { enAlerta } from '../../utils/stock/estadoInsumo'

// Página «Reportar baja» (D-S3). La validación real y el registro del movimiento los hace
// el backend (RN-10). Al guardar vuelve a Stock; si el insumo cruzó el mínimo, avisa (RN-11).
export function useReportarBaja(sucursalId: number, volverA: string) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const [sucursal, setSucursal] = useState<{ nombre: string } | null>(null)
  const [stock, setStock] = useState<ItemStock[] | null>(null)
  const [errorCarga, setErrorCarga] = useState('')
  const [form, setForm] = useState<FormBaja>(FORM_BAJA_VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vigente = true
    obtenerSucursalPorId(sucursalId)
      .then((datos) => {
        if (vigente) setSucursal(datos)
      })
      .catch(() => {})
    ;(obtenerStockPorSucursal(sucursalId) as Promise<ItemStock[]>)
      .then((datos) => {
        if (vigente) setStock(datos)
      })
      .catch((err) => {
        if (!vigente) return
        setStock([])
        setErrorCarga(err instanceof Error ? err.message : 'No se pudo cargar el stock')
      })
    return () => {
      vigente = false
    }
  }, [sucursalId])

  const cambiar = useCallback((campo: keyof FormBaja, valor: string) => {
    setForm((previo) => ({ ...previo, [campo]: valor }))
    setError('')
  }, [])

  async function enviar() {
    const invalido = validarBaja(form)
    if (invalido) {
      setError(invalido)
      return
    }
    const antes = stock?.find((s) => String(s.id) === form.stockId)
    setEnviando(true)
    try {
      await registrarBaja(Number(form.stockId), {
        cantidad: Number(form.cantidad),
        motivo: form.motivo,
        detalle: form.detalle.trim(),
      })
    } catch (err) {
      // Lo cargado no se pierde: el error queda en la página
      setError(err instanceof Error ? err.message : 'No se pudo registrar la baja.')
      setEnviando(false)
      return
    }

    let alertaBaja: ItemStock[] = []
    try {
      const actualizado = (await obtenerStockPorSucursal(sucursalId)) as ItemStock[]
      const despues = actualizado.find((s) => String(s.id) === form.stockId)
      if (antes && despues && !enAlerta(antes) && enAlerta(despues)) alertaBaja = [despues]
    } catch {
      // La baja ya quedó registrada: si falla la relectura, se vuelve sin alerta
    }
    mostrarToast('Baja registrada!')
    navigate(volverA, { state: { desdeBaja: true, alertaBaja } })
  }

  return { sucursal, stock, errorCarga, form, cambiar, error, enviando, enviar }
}
