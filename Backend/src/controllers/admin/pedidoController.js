const { Pedido, DetallePedido, Producto, Admin, Usuario, Direccion, Sucursal } = require('../../models');

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
        const sucursalIdParam = req.params.id;
        const sucursal = await Sucursal.findByPk(sucursalIdParam);

        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const { usuario } = req;
        const admin = await Admin.findByPk(usuario.id);

        // se compara con null para que no rechace al master
        // se compara la sucursal del admin con la sucursal q se quiere ver
        if (admin.sucursalId !== null && admin.sucursalId !== Number(sucursalIdParam)) {
            return res.status(403).json({ mensaje: 'No tienes permisos para acceder a esta sucursal' });
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
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener los pedidos' });
    }
};

// GET /admin/pedidos/:id → detalle completo: productos, cliente, dirección y sucursal
const obtenerPedidoPorId = async (req, res) => {
    try {
        const { usuario } = req;

        const pedido = await Pedido.findByPk(req.params.id, {
            include: [CLIENTE, DIRECCION, SUCURSAL, DETALLE],
        });

        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        const admin = await Admin.findByPk(usuario.id);
        if (admin.sucursalId !== null && admin.sucursalId !== pedido.sucursalId) {
            return res.status(403).json({
                mensaje: 'Acceso denegado: no tienes permisos para gestionar los pedidos de esta sucursal'
            });
        }

        res.status(200).json(pedido);
    } catch (error) {
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener el pedido' });
    }
};
const cambiarEstadoPedidoPorId = async (req, res) => {
    try {
        const { usuario } = req;
        const { estado } = req.body;

        const pedido = await Pedido.findByPk(req.params.id);

        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        const admin = await Admin.findByPk(usuario.id);
        if (admin.sucursalId !== null && Number(admin.sucursalId) !== Number(pedido.sucursalId)) {
            return res.status(403).json({
                mensaje: 'Acceso denegado: no tienes permisos para gestionar los pedidos de esta sucursal'
            });
        }

        if (estado === pedido.estado) {
            return res.status(400).json({
                mensaje: `El pedido ya se encuentra en el estado: ${estado}`
            });
        }

        await pedido.update({ estado });
        await pedido.save();
        res.status(200).json(pedido);
    } catch (error) {
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al cambiar el estado del pedido' });
    }
};

module.exports = {
    obtenerPedidosPorSucursal,
    obtenerPedidoPorId,
    cambiarEstadoPedidoPorId,
};