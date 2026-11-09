const { Op } = require('sequelize');
const { Pedido, Calificacion, Usuario } = require('../models');
const { dentroDelPlazo } = require('../config/calificaciones');
// Días para calificar y opiniones del inicio: se editan desde el admin (Parámetros)
const { obtenerParametros } = require('../utils/parametros');
// Los pedidos viejos pueden tener el estado en minúscula: se compara sin importar mayúsculas
const estaEntregado = (pedido) => String(pedido.estado).toLowerCase() === 'entregado';
// POST /calificaciones → califica un pedido entregado (una sola vez por pedido).
// Queda PENDIENTE hasta que un admin la apruebe.
const crearCalificacion = async (req, res) => {
    try {
        const { usuarioId, pedidoId, puntaje, comentario } = req.body;

        const pedido = await Pedido.findByPk(pedidoId);
        // 404 genérico si el pedido es de otro cliente: no se confirma que existe
        if (!pedido || Number(pedido.usuarioId) !== Number(usuarioId)) {
            return res.status(404).json({ mensaje: 'Pedido no encontrado' });
        }
        if (!estaEntregado(pedido)) {
            return res.status(400).json({ mensaje: 'Solo podés calificar pedidos que ya recibiste' });
        }
        const { diasParaCalificar } = await obtenerParametros();
        if (!dentroDelPlazo(pedido.fecha, diasParaCalificar)) {
            return res.status(400).json({ mensaje: `El plazo para calificar este pedido venció (${diasParaCalificar} días)` });
        }

        try {
            await Calificacion.create({
                pedidoId: pedido.id,
                usuarioId: pedido.usuarioId,
                sucursalId: pedido.sucursalId ?? null,
                puntaje,
                comentario: comentario || null,
            });
        } catch (error) {
            // La base no permite dos calificaciones para el mismo pedido
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ mensaje: 'Ya calificaste este pedido' });
            }
            throw error;
        }

        return res.status(201).json({ mensaje: '¡Gracias por tu calificación!' });
    } catch (error) {
        console.error('Error al crear la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al guardar la calificación' });
    }
};

// GET /calificaciones/recientes → las últimas aprobadas con comentario, para el inicio.
// Solo el nombre del cliente: el apellido nunca sale del servidor.
const obtenerRecientes = async (req, res) => {
    try {
        const { opinionesEnInicio } = await obtenerParametros();
        const calificaciones = await Calificacion.findAll({
            where: { estado: 'APROBADA', comentario: { [Op.ne]: null } },
            include: [{ model: Usuario, as: 'usuario', attributes: ['nombre'] }],
            order: [['createdAt', 'DESC']],
            limit: opinionesEnInicio,
        });

        return res.json(calificaciones.map((c) => ({
            id: c.id,
            nombre: c.usuario?.nombre ?? 'Cliente',
            puntaje: c.puntaje,
            comentario: c.comentario,
            fecha: c.createdAt,
        })));
    } catch (error) {
        console.error('Error al obtener las calificaciones recientes:', error.message);
        return res.status(500).json({ mensaje: 'Error al obtener las calificaciones' });
    }
};

module.exports = { crearCalificacion, obtenerRecientes };