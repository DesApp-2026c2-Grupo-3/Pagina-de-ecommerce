const { Pedido, Calificacion } = require('../models');
const { estaEntregado, entregadoEn, itemsCalificables, buscarPendiente } = require('../utils/calificaciones');
const { estadoDeLaVentana, sePuedeEditar, MINUTOS_PARA_CALIFICAR, DIAS_PARA_CALIFICAR, HORAS_PARA_EDITAR } = require('../config/calificaciones');

// El cliente se identifica con su usuarioId, igual que en el resto de los pedidos de la tienda

const aRespuesta = (c) => ({
    id: c.id,
    pedidoId: c.pedidoId,
    productoId: c.productoId,
    puntaje: c.puntaje ?? null,
    comentario: c.comentario ?? null,
});
const comentarioLimpio = (comentario) => (comentario ? comentario : null);
const puntajeLimpio = (puntaje) => (puntaje ? puntaje : null);

// GET /calificaciones/pendiente?usuarioId=1 → el pedido para calificar (con sus productos), o { pendiente: null }
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

// POST /calificaciones → califica los productos de un pedido entregado (una sola vez por pedido).
// body: { usuarioId, pedidoId, items: [{ productoId, puntaje?, comentario? }] }. Los productos sin estrellas ni comentario se ignoran.
const crearCalificacion = async (req, res) => {
    try {
        const { usuarioId, pedidoId, items } = req.body;

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

        // Solo se califica lo que el cliente pidió (y no las salsas gratuitas)
        const permitidos = new Set((await itemsCalificables(pedido.id)).map((i) => i.productoId));
        const conContenido = items.filter((i) => i.puntaje != null || i.comentario);
        if (conContenido.some((i) => !permitidos.has(Number(i.productoId)))) {
            return res.status(400).json({ mensaje: 'Uno de los productos no se puede calificar en este pedido' });
        }
        if (conContenido.length === 0) {
            return res.status(400).json({ mensaje: 'Calificá al menos un producto o dejá un comentario' });
        }

        let calificaciones;
        try {
            calificaciones = await Calificacion.bulkCreate(conContenido.map((i) => ({
                pedidoId: pedido.id,
                productoId: Number(i.productoId),
                usuarioId: pedido.usuarioId,
                sucursalId: pedido.sucursalId ?? null,
                puntaje: puntajeLimpio(i.puntaje),
                comentario: comentarioLimpio(i.comentario),
            })));
        } catch (error) {
            // Dos envíos a la vez: gana el primero
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ mensaje: 'Ya calificaste este pedido' });
            }
            throw error;
        }

        return res.status(201).json({ mensaje: '¡Gracias por tu calificación!', calificaciones: calificaciones.map(aRespuesta) });
    } catch (error) {
        console.error('Error al crear la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al guardar la calificación' });
    }
};

// PATCH /calificaciones/:id → corrige la calificación de un producto durante las primeras HORAS_PARA_EDITAR
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

        const cambios = {
            puntaje: puntaje === undefined ? calificacion.puntaje : puntajeLimpio(puntaje),
            comentario: comentario === undefined ? calificacion.comentario : comentarioLimpio(comentario),
        };
        if (!cambios.puntaje && !cambios.comentario) {
            return res.status(400).json({ mensaje: 'Dejá las estrellas o un comentario' });
        }

        await calificacion.update(cambios);
        return res.status(200).json({ mensaje: 'Calificación modificada', calificacion: aRespuesta(calificacion) });
    } catch (error) {
        console.error('Error al editar la calificación:', error.message);
        return res.status(500).json({ mensaje: 'Error al modificar la calificación' });
    }
};

module.exports = { obtenerPendiente, crearCalificacion, editarCalificacion };
