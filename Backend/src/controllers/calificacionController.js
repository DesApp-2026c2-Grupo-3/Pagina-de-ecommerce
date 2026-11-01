const { Pedido, Calificacion } = require('../models');
const { estaEntregado, entregadoEn, buscarPendiente } = require('../utils/calificaciones');
const { estadoDeLaVentana, sePuedeEditar, MINUTOS_PARA_CALIFICAR, DIAS_PARA_CALIFICAR, HORAS_PARA_EDITAR } = require('../config/calificaciones');

// El cliente se identifica con su usuarioId, igual que en el resto de los pedidos de la tienda

const aRespuesta = (c) => ({ id: c.id, pedidoId: c.pedidoId, puntaje: c.puntaje, comentario: c.comentario ?? null });
const comentarioLimpio = (comentario) => (comentario ? comentario : null);

// GET /calificaciones/pendiente?usuarioId=1 → el pedido para calificar, o { pendiente: null }
const obtenerPendiente = async (req, res) => {
    try {
        const usuarioId = Number(req.query.usuarioId);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ mensaje: 'El usuario no es válido' });
        }

        const pendiente = await buscarPendiente(usuarioId);
        return res.status(200).json({ pendiente });
    } catch (error) {
        console.error('Error al buscar la calificación pendiente:', error.message);
        return res.status(500).json({ mensaje: 'Error al buscar la calificación pendiente' });
    }
};

// POST /calificaciones → califica un pedido entregado (una sola vez por pedido)
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

        const entregado = await entregadoEn(pedido.id);
        const ventana = entregado ? estadoDeLaVentana(entregado) : 'VENCIDA';
        if (ventana === 'ANTES') {
            return res.status(400).json({
                mensaje: `Todavía es pronto: podés calificar el pedido ${MINUTOS_PARA_CALIFICAR} minutos después de recibirlo`,
            });
        }
        if (ventana === 'VENCIDA') {
            return res.status(400).json({
                mensaje: `El plazo para calificar este pedido venció (${DIAS_PARA_CALIFICAR} días desde la entrega)`,
            });
        }

        if (await Calificacion.findOne({ where: { pedidoId: pedido.id }, attributes: ['id'] })) {
            return res.status(409).json({ mensaje: 'Ya calificaste este pedido' });
        }

        let calificacion;
        try {
            calificacion = await Calificacion.create({
                pedidoId: pedido.id,
                usuarioId: pedido.usuarioId,
                sucursalId: pedido.sucursalId ?? null,
                puntaje,
                comentario: comentarioLimpio(comentario),
            });
        } catch (error) {
            // Dos envíos a la vez: gana el primero
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ mensaje: 'Ya calificaste este pedido' });
            }
            throw error;
        }

        return res.status(201).json({ mensaje: '¡Gracias por tu calificación!', calificacion: aRespuesta(calificacion) });
    } catch (error) {
        console.error('Error al crear la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al guardar la calificación' });
    }
};

// PATCH /calificaciones/:id → corrige la calificación durante las primeras HORAS_PARA_EDITAR
const editarCalificacion = async (req, res) => {
    try {
        const { usuarioId, puntaje, comentario } = req.body;

        const calificacion = await Calificacion.findByPk(req.params.id);
        if (!calificacion || Number(calificacion.usuarioId) !== Number(usuarioId)) {
            return res.status(404).json({ mensaje: 'Calificación no encontrada' });
        }
        if (!sePuedeEditar(calificacion.createdAt)) {
            return res.status(400).json({
                mensaje: `Ya pasaron las ${HORAS_PARA_EDITAR} horas para modificar la calificación`,
            });
        }

        await calificacion.update({ puntaje, comentario: comentarioLimpio(comentario) });
        return res.status(200).json({ mensaje: 'Calificación modificada', calificacion: aRespuesta(calificacion) });
    } catch (error) {
        console.error('Error al editar la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al modificar la calificación' });
    }
};

module.exports = { obtenerPendiente, crearCalificacion, editarCalificacion };
