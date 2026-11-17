// Cómo ve el CLIENTE el estado de su pedido.
//
// El repartidor marca "En camino" al retirar cada pedido en el local, mientras arma el viaje
// (viaje "preparando"). Para el cliente el pedido sale recién cuando el repartidor inicia el
// viaje (viaje "activo"): hasta entonces se le muestra como "Listo para retirar", que la app
// de clientes presenta como "En proceso", y la hora de "En camino" es la de inicio del viaje.

const normalizar = (estado) => String(estado ?? '').trim().toLowerCase();

/**
 * Recibe el pedido en JSON plano con `Viaje: { estado, fechaInicio }` (puede faltar)
 * y lo devuelve listo para el cliente, sin datos del viaje.
 */
function adaptarPedidoParaCliente(datos) {
    if (!datos || typeof datos !== 'object') return datos;

    const { Viaje: viaje, ...pedido } = datos;
    if (normalizar(pedido.estado) !== 'en camino' || !viaje) return pedido;

    const historial = Array.isArray(pedido.historialDeTiemposPedidos)
        ? pedido.historialDeTiemposPedidos
        : null;

    // Retirado, pero el viaje todavía no arrancó
    if (normalizar(viaje.estado) === 'preparando') {
        return {
            ...pedido,
            estado: 'Listo para retirar',
            ...(historial && {
                historialDeTiemposPedidos: historial.filter((h) => normalizar(h.estado) !== 'en camino'),
            }),
        };
    }

    // Viaje en curso: "En camino" desde que salió el repartidor
    if (viaje.fechaInicio && historial) {
        const salida = new Date(viaje.fechaInicio);
        if (!Number.isNaN(salida.getTime())) {
            return {
                ...pedido,
                historialDeTiemposPedidos: historial.map((h) => (
                    normalizar(h.estado) === 'en camino' && new Date(h.fecha) < salida
                        ? { ...h, fecha: salida.toISOString() }
                        : h
                )),
            };
        }
    }

    return pedido;
}

module.exports = { adaptarPedidoParaCliente };
