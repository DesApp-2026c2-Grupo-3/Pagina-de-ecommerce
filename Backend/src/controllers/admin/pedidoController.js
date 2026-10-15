const { Pedido, DetallePedido, Producto, Admin, Usuario, Direccion, Sucursal, historialDeTiemposPedido, sequelize } = require('../../models');
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
// Línea de tiempo de estados: se devuelve ordenada cronológicamente en el detalle
// `as` explícito: coincide con el alias del modelo y la clave que espera el front (`historialDeTiemposPedidos`)
const HISTORIAL = { model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos', attributes: ['id', 'estado', 'estadoAnterior', 'fecha'] };

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
        // Auth primero: no se revela si la sucursal existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const sucursal = await Sucursal.findByPk(req.params.id);
        if (!sucursal) {
            return res.status(404).json({ mensaje: 'Sucursal no encontrada' });
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
        // Auth primero: no se revela si el pedido existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const pedido = await Pedido.findByPk(req.params.id, {
            include: [CLIENTE, DIRECCION, SUCURSAL, DETALLE, HISTORIAL],
            order: [
                [{ model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos' }, 'fecha', 'ASC'],
                [{ model: historialDeTiemposPedido, as: 'historialDeTiemposPedidos' }, 'id', 'ASC'],
            ],
        });
        // Sin permiso se responde 404 genérico (no 403): evita confirmar
        // a un admin de otra sucursal que el pedido existe (prevención de IDOR/enumeración)
        if (!pedido || !puedeVerSucursal(admin, pedido.sucursalId)) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        res.status(200).json(pedido);
    } catch (error) {
        console.error('Algo salió mal:', error.message);
        res.status(500).json({ mensaje: 'Error al obtener el pedido' });
    }
};

// PATCH /admin/pedidos/editar/estado/:id → cambia el estado;
// solo devuelve el stock si se cancela desde "Pendiente". Nunca se puede volver a "Pendiente".
const cambiarEstadoPedidoPorId = async (req, res) => {
    try {
        const { estado } = req.body;

        // Auth primero: no se revela si el pedido existe a quien no tiene sesión
        const admin = await Admin.findByPk(req.usuario.id);
        if (!admin) {
            return res.status(401).json({ mensaje: 'Iniciá sesión de nuevo' });
        }

        const pedido = await Pedido.findByPk(req.params.id);
        // Sin permiso se responde 404 genérico (no 403): evita confirmar
        // a un admin de otra sucursal que el pedido existe (prevención de IDOR/enumeración)
        if (!pedido || !puedeVerSucursal(admin, pedido.sucursalId)) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
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
        // Una vez que el pedido abandona Pendiente nunca puede volver:
        // Pendiente es solo el estado inicial
        if (mismoEstado(estado, 'pendiente') && !mismoEstado(pedido.estado, 'pendiente')) {
            return res.status(400).json({
                mensaje: 'Un pedido que salió de Pendiente no puede volver a Pendiente'
            });
        }

        // El cambio de estado y su registro en la línea de tiempo van juntos
        // (igual que la eventual devolución de stock): o se hacen todos, o ninguno
        const t = await sequelize.transaction();
        try {
            const estadoPrevio = pedido.estado;
            await pedido.update({ estado }, { transaction: t });
            await historialDeTiemposPedido.create({
                pedidoId: pedido.id,
                estadoAnterior: estadoPrevio,
                estado,
                fecha: new Date(),
            }, { transaction: t });
            // Solo se devuelve el stock si se cancela desde Pendiente (sin preparación iniciada).
            // Desde En proceso / En camino no hay devolución automática: queda para manejo manual.
            if (mismoEstado(estado, 'cancelado') && mismoEstado(estadoPrevio, 'pendiente')) {
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