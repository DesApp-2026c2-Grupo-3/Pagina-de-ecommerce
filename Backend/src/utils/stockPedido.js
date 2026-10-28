const { MovimientoStock, StockSucursal } = require('../models');

const redondear = (n) => Math.round(n * 1000) / 1000;

// Devuelve a la sucursal todo lo que descontó la venta de un pedido, y lo registra en el historial.
// Se llama al cancelar un pedido, dentro de la misma transacción del cambio de estado:
//
//     await devolverStockPedido(pedido.id, { transaction: t, adminId })
//
// Es segura de llamar dos veces: si el pedido ya se devolvió, no hace nada.
async function devolverStockPedido(pedidoId, { transaction, adminId = null } = {}) {
    const yaDevuelto = await MovimientoStock.count({ where: { pedidoId, tipo: 'devolucion' }, transaction });
    if (yaDevuelto > 0) return 0;

    const ventas = await MovimientoStock.findAll({ where: { pedidoId, tipo: 'venta' }, transaction });

    // Lo vendido de cada insumo en cada sucursal, sumado
    const porInsumo = new Map();
    for (const v of ventas) {
        const clave = `${v.sucursalId}-${v.insumoId}`;
        const previo = porInsumo.get(clave) ?? { sucursalId: v.sucursalId, insumoId: v.insumoId, cantidad: 0 };
        previo.cantidad = redondear(previo.cantidad + Number(v.cantidad));
        porInsumo.set(clave, previo);
    }

    for (const { sucursalId, insumoId, cantidad } of porInsumo.values()) {
        const stock = await StockSucursal.findOne({
            where: { sucursalId, insumoId },
            transaction,
            lock: transaction ? transaction.LOCK.UPDATE : undefined,
        });
        if (!stock) continue;

        const anterior = Number(stock.cantidad);
        const nueva = redondear(anterior + cantidad);
        await stock.update({ cantidad: nueva }, { transaction });
        await MovimientoStock.create({
            sucursalId,
            insumoId,
            tipo: 'devolucion',
            cantidad,
            cantidadAnterior: anterior,
            cantidadNueva: nueva,
            motivo: 'cancelacion',
            pedidoId,
            adminId,
        }, { transaction });
    }

    return porInsumo.size;
}

module.exports = { devolverStockPedido };