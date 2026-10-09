const { Op, fn, col, literal } = require('sequelize');
const { DetallePedido, Pedido } = require('../models');

const LIMITE_POR_DEFECTO = 4;
const LIMITE_MAXIMO = 12;

// GET /productos/mas-pedidos?sucursalId=2&limite=4
// Ranking de productos por unidades pedidas (sin contar pedidos cancelados).
// Con sucursalId, solo los pedidos de esa sucursal.
// Responde: [{ productoId: 12, vendidos: 37 }, ...] de mayor a menor
const obtenerMasPedidos = async (req, res) => {
    try {
        const sucursalId = req.query.sucursalId !== undefined ? Number(req.query.sucursalId) : null;
        if (sucursalId !== null && (!Number.isInteger(sucursalId) || sucursalId <= 0)) {
            return res.status(400).json({ mensaje: 'La sucursal no es válida' });
        }

        const pedido = Number(req.query.limite);
        const limite = Number.isInteger(pedido) && pedido > 0 ? Math.min(pedido, LIMITE_MAXIMO) : LIMITE_POR_DEFECTO;

        const filas = await DetallePedido.findAll({
            attributes: ['productoId', [fn('SUM', col('DetallePedido.cantidad')), 'vendidos']],
            include: [{
                model: Pedido,
                attributes: [],
                where: {
                    estado: { [Op.notILike]: 'cancelado' },
                    ...(sucursalId ? { sucursalId } : {}),
                },
            }],
            group: ['DetallePedido.productoId'],
            order: [[literal('"vendidos"'), 'DESC']],
            limit: limite,
            subQuery: false,
            raw: true,
        });

        res.json(filas.map((f) => ({ productoId: f.productoId, vendidos: Number(f.vendidos) })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los productos más pedidos' });
    }
};

module.exports = { obtenerMasPedidos };