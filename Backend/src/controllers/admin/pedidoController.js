const { Pedido, DetallePedido, Producto, Usuario, Direccion, Sucursal } = require('../../models');

// Qué se trae de cada parte del pedido (nunca la contraseña del cliente)
const DETALLE = {
    model: DetallePedido,
    include: [{ model: Producto, attributes: ['id', 'nombre', 'imagen'] }],
};
const CLIENTE = { model: Usuario, attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] };
const DIRECCION = {
    model: Direccion,
    attributes: ['id', 'alias', 'calle', 'numero', 'piso', 'localidad', 'provincia', 'observaciones', 'latitud', 'longitud'],
};
const SUCURSAL = { model: Sucursal, attributes: ['id', 'nombre'] };

// GET /admin/pedidos/sucursal/:id            → pedidos de la sucursal, del más nuevo al más viejo
// GET /admin/pedidos/sucursal/:id?estado=... → filtrados por estado
const obtenerPedidosPorSucursal = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id);

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const where = { sucursalId: sucursal.id };
        if (req.query.estado) {
            where.estado = req.query.estado;
        }

        const pedidos = await Pedido.findAll({
            where,
            include: [CLIENTE, DETALLE],
            order: [['fecha', 'DESC']],
        });

        res.status(200).json(pedidos);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
    }
};

// GET /admin/pedidos/:id → detalle completo: productos, cliente, dirección y sucursal
const obtenerPedidoPorId = async (req, res) => {
    try {
        const pedido = await Pedido.findByPk(req.params.id, {
            include: [CLIENTE, DIRECCION, SUCURSAL, DETALLE],
        });

        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error al obtener el pedido' });
    }
};

module.exports = {
    obtenerPedidosPorSucursal,
    obtenerPedidoPorId,
};