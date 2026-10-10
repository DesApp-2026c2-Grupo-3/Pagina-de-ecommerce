const { Pedido, DetallePedido, Producto, Admin, Usuario, Direccion, Sucursal, sequelize } = require('../../models');
const { devolverStockPedido } = require('../../utils/stockPedido');

// Qué se trae de cada parte del pedido (nunca la contraseña del cliente).
// paranoid: false → los productos eliminados (borrado lógico) se siguen viendo en los pedidos viejos
const DETALLE = {
    model: DetallePedido,
    include: [{ model: Producto, attributes: ['id', 'nombre', 'imagen'], paranoid: false }],
};
const CLIENTE = { model: Usuario, attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] };
const DIRECCION = {
    model: Direccion,
    attributes: ['id', 'alias', 'calle', 'numero', 'piso', 'localidad', 'provincia', 'observaciones', 'latitud', 'longitud'],
};
const SUCURSAL = { model: Sucursal, attributes: ['id', 'nombre'] };

// Un pedido en estos estados ya está cerrado: no se puede cambiar
const ESTADOS_FINALES = ['entregado', 'cancelado'];

// Los pedidos viejos pueden tener el estado en minúscula ("pendiente"): se compara sin importar mayúsculas
const mismoEstado = (a, b) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

// El master (sin sucursal) puede todo; el admin de sucursal, solo la suya
function puedeVerSucursal(admin, sucursalId) {
    return admin.sucursalId === null || Number(admin.sucursalId) === Number(sucursalId);
}

// GET /admin/pedidos/sucursal/:id            → pedidos de la sucursal, del más nuevo al más viejo
// GET /admin/pedidos/sucursal/:id?estado=... → filtrados por estado
const obtenerPedidosPorSucursal = async (req, res) => {
    try {
        const sucursal = await Sucursal.findByPk(req.params.id);
        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
        }

        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }
        if (!puedeVerSucursal(admin, sucursal.id)) {
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
        const pedido = await Pedido.findByPk(req.params.id, {
            include: [CLIENTE, DIRECCION, SUCURSAL, DETALLE],
        });
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }
        if (!puedeVerSucursal(admin, pedido.sucursalId)) {
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

// PATCH /admin/pedidos/editar/estado/:id → cambia el estado; si es "Cancelado", devuelve el stock
const cambiarEstadoPedidoPorId = async (req, res) => {
    try {
        const { estado } = req.body;

        const pedido = await Pedido.findByPk(req.params.id);
        if (!pedido) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }

        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }
        if (!puedeVerSucursal(admin, pedido.sucursalId)) {
            return res.status(403).json({
                mensaje: 'Acceso denegado: no tienes permisos para gestionar los pedidos de esta sucursal'
            });
        }

        if (ESTADOS_FINALES.some((final) => mismoEstado(pedido.estado, final))) {
            return res.status(400).json({
                mensaje: `El pedido ya está ${String(pedido.estado).toLowerCase()} y no se puede modificar`
            });
        }
        if (mismoEstado(estado, pedido.estado)) {
            return res.status(400).json({
                mensaje: `El pedido ya se encuentra en el estado: ${estado}`
            });
        }

        // El cambio de estado y la devolución de stock van juntos: o se hacen los dos, o ninguno
        const t = await sequelize.transaction();
        try {
            await pedido.update({ estado }, { transaction: t });
            if (mismoEstado(estado, 'cancelado')) {
                await devolverStockPedido(pedido.id, { transaction: t, adminId: admin.id });
            }
            await t.commit();
        } catch (error) {
            await t.rollback();
            throw error;
        }

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