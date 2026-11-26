// Sucursal elegida por el MASTER en Pedidos y Viajes (D-V2, D-V4).
// sessionStorage: dura mientras la pestaña esté abierta (también al recargar) y es por pestaña.
// Se borra al cerrar sesión (AuthContext). Cualquier error del storage se trata como «sin dato».
export const PREFIJO_SUCURSAL = 'bf-admin:sucursal:'

function almacen(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export function leerSucursalGuardada(adminId: number | null | undefined): number | null {
  if (!adminId) return null
  try {
    const valor = Number(almacen()?.getItem(PREFIJO_SUCURSAL + adminId))
    return Number.isInteger(valor) && valor > 0 ? valor : null
  } catch {
    return null
  }
}

export function guardarSucursal(adminId: number | null | undefined, sucursalId: number): void {
  if (!adminId || !Number.isInteger(sucursalId) || sucursalId <= 0) return
  try {
    almacen()?.setItem(PREFIJO_SUCURSAL + adminId, String(sucursalId))
  } catch {
    // Sin storage (modo privado, cuota): solo se pierde el recuerdo, la pantalla sigue
  }
}

// Al cerrar sesión: borra la de todos los administradores de esta pestaña
export function limpiarSucursalesGuardadas(): void {
  const storage = almacen()
  if (!storage) return
  try {
    const claves: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const clave = storage.key(i)
      if (clave?.startsWith(PREFIJO_SUCURSAL)) claves.push(clave)
    }
    claves.forEach((clave) => storage.removeItem(clave))
  } catch {
    // Nada que limpiar
  }
}

// URL (enlace o aviso) > guardada > primera de la lista. Una guardada que ya no existe se ignora.
export function resolverSucursal(
  desdeUrl: number | null,
  guardada: number | null,
  sucursales: { id: number }[] | null,
): number | null {
  if (desdeUrl !== null) return desdeUrl
  if (guardada !== null && (sucursales === null || sucursales.some((s) => s.id === guardada))) return guardada
  return sucursales?.[0]?.id ?? null
}
