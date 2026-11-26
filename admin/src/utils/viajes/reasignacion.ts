// Consecuencia concreta de reasignar un viaje (RN-32 y RN-55), para la confirmación inline
export function textoConsecuenciaReasignacion(anterior: string, nuevo: string): string {
  return `${anterior} quedará inactivo hasta que lo reactives desde Repartidores. ` +
    `${nuevo} tiene que confirmar que recibió los pedidos antes de entregarlos.`
}

// D-22 / D-24: cartel después de reasignar
export function textoReasignacionHecha(viajeId: number, nuevo: string, anterior: string): string {
  return `Viaje #${viajeId} reasignado a ${nuevo}. ` +
    `${anterior} quedó inactivo hasta que lo reactives desde Repartidores.`
}
