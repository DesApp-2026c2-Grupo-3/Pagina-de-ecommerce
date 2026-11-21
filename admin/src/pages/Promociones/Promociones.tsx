import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { obtenerPromociones, obtenerProductoNuevo } from '../../services/promocionService'
import { obtenerProductos } from '../../services/productoService'
import { obtenerParametros } from '../../services/parametroService'
import type { PromocionAdmin } from '../../types/promocion.types'
import type { ProductoOpcion } from '../../utils/mecanicasPromo'
import BloqueProductoSemana from '../../components/promociones/BloqueProductoSemana'
import BloqueRegalo from '../../components/promociones/BloqueRegalo'
import BloqueNuevo from '../../components/promociones/BloqueNuevo'
import SemanaPromos, { type AbiertoSemana } from '../../components/promociones/SemanaPromos'

// La pantalla es un mapa de la página de Promos de la tienda: los mismos 4 bloques, en el mismo orden.
// Cada bloque muestra lo publicado y se edita ahí mismo. Hay un solo editor abierto a la vez.
type Abierto = 'semana' | 'regalo' | 'nuevo' | { dia: number; promoId: number | null; productoId?: number } | null

export default function Promociones() {
  const { mostrarToast } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const [promos, setPromos] = useState<PromocionAdmin[]>([])
  const [productos, setProductos] = useState<ProductoOpcion[]>([])
  const [productoNuevoId, setProductoNuevoId] = useState<number | null>(null)
  const [maxPorDia, setMaxPorDia] = useState(3)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [abierto, setAbierto] = useState<Abierto>(null)

  const cargar = useCallback(async () => {
    try {
      const [listaPromos, nuevo] = await Promise.all([obtenerPromociones(), obtenerProductoNuevo()])
      setPromos(listaPromos)
      setProductoNuevoId(nuevo.productoId)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las promociones.')
    }
  }, [])

  useEffect(() => {
    Promise.all([
      cargar(),
      obtenerProductos()
        .then((lista: any[]) =>
          setProductos(
            lista
              .map((p) => ({ id: p.id as number, nombre: p.nombre as string, precio: Number(p.precio) }))
              .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
          ),
        )
        .catch(() => setError('No se pudo cargar la lista de productos. Revisá que el backend esté funcionando.')),
      obtenerParametros()
        .then((p) => setMaxPorDia(p.maxPromosPorDia))
        .catch(() => setMaxPorDia(3)),
    ]).finally(() => setCargando(false))
  }, [cargar])

  // Desde el reporte de menos vendidos: se abre una promo del día para hoy con ese producto
  useEffect(() => {
    const productoId = (location.state as { productoParaPromo?: number } | null)?.productoParaPromo
    if (cargando || !productoId) return
    setAbierto({ dia: new Date().getDay(), promoId: null, productoId })
    navigate(location.pathname, { replace: true, state: null })
  }, [cargando, location.state, location.pathname, navigate])

  async function guardado(mensaje: string) {
    setAbierto(null)
    mostrarToast(mensaje)
    await cargar()
  }

  const cerrar = () => setAbierto(null)
  // Producto y regalo de la semana: el que está activo (hay uno solo)
  const semana = promos.find((p) => p.tipo === 'SEMANA' && p.activo) ?? null
  const regalo = promos.find((p) => p.tipo === 'REGALO' && p.activo) ?? null
  const delDia = promos.filter((p) => p.tipo === 'DIA')
  const abiertoSemana: AbiertoSemana = typeof abierto === 'object' ? abierto : null

  return (
    <main className="p-4 sm:p-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-600">Página de Promos</p>
        <h1 className="text-3xl font-bold">Promociones</h1>
        <p className="mt-2 text-gray-600">
          Cada bloque es una parte de la página de Promos de la tienda, en el mismo orden. Tocá «Cambiar» en el que quieras editar.
        </p>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {cargando ? (
        <p className="text-gray-600">Cargando promociones...</p>
      ) : (
        <div className="flex flex-col gap-4">
          <BloqueProductoSemana
            promo={semana}
            productos={productos}
            abierta={abierto === 'semana'}
            onAbrir={() => setAbierto('semana')}
            onCerrar={cerrar}
            onGuardado={guardado}
          />
          <BloqueRegalo
            promo={regalo}
            productos={productos}
            abierta={abierto === 'regalo'}
            onAbrir={() => setAbierto('regalo')}
            onCerrar={cerrar}
            onGuardado={guardado}
          />
          <BloqueNuevo
            productoId={productoNuevoId}
            productos={productos}
            abierta={abierto === 'nuevo'}
            onAbrir={() => setAbierto('nuevo')}
            onCerrar={cerrar}
            onGuardado={guardado}
          />
          <SemanaPromos
            promos={delDia}
            productos={productos}
            maxPorDia={maxPorDia}
            abierto={abiertoSemana}
            onAbrir={setAbierto}
            onCerrar={cerrar}
            onGuardado={guardado}
          />
        </div>
      )}
    </main>
  )
}
