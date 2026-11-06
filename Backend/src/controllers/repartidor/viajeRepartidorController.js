const { Op } = require('sequelize');
const { Viaje, Pedido , Usuario, Direccion, DetallePedido, Producto }= require('../../models');

const tomarPedidos = async (req, res) => {
    const { pedidoIds } = req.body;
    const { id: repartidorId, sucursalId } = req.repartidor;

    // Validar que se hayan enviado pedidos válidos.
    if (
        !Array.isArray(pedidoIds) ||
        pedidoIds.length === 0 ||
        !pedidoIds.every(id => Number.isInteger(id) && id > 0)
    ) {
        return res.status(400).json({
            mensaje: 'Debés seleccionar al menos un pedido válido',
        });
    }

    // Evitar IDs repetidos.
    const idsUnicos = [...new Set(pedidoIds)];

    if (idsUnicos.length !== pedidoIds.length) {
        return res.status(400).json({
            mensaje: 'La selección contiene pedidos duplicados',
        });
    }

    const transaction = await Viaje.sequelize.transaction();

    try {
        // Comprobar que el repartidor no tenga otro viaje en curso.
        const viajeExistente = await Viaje.findOne({
            where: {
                repartidorId,
                estado: {
                    [Op.in]: [
                        'preparando',
                        'activo',
                        'requiere asistencia',
                    ],
                },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (viajeExistente) {
            const error = new Error(
                'Ya tenés un viaje en curso. Debés finalizarlo antes de tomar otros pedidos'
            );
            error.statusCode = 409;
            throw error;
        }

        // Buscar y bloquear los pedidos seleccionados.
        const pedidos = await Pedido.findAll({
            where: {
                id: { [Op.in]: idsUnicos },
                sucursalId,
                estado: 'Listo para retirar',
                viajeId: null,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (pedidos.length !== idsUnicos.length) {
            const error = new Error(
                'Uno o más pedidos ya no están disponibles o no pertenecen a tu sucursal'
            );
            error.statusCode = 409;
            throw error;
        }

        // Crear el viaje en preparación.
        const viaje = await Viaje.create(
            {
                repartidorId,
                estado: 'preparando',
                fechaInicio: null,
            },
            { transaction }
        );

        // Asociar los pedidos al viaje.
        await Pedido.update(
            { viajeId: viaje.id },
            {
                where: {
                    id: { [Op.in]: idsUnicos },
                },
                transaction,
            }
        );

        await transaction.commit();

        return res.status(201).json({
            mensaje: 'Pedidos asignados correctamente. Retiralos para poder iniciar el viaje',
            viaje: {
                id: viaje.id,
                repartidorId: viaje.repartidorId,
                fechaInicio: viaje.fechaInicio,
                estado: viaje.estado,
            },
            pedidoIds: idsUnicos,
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error('Error al tomar pedidos:', error.message);

        return res.status(
            error.statusCode ||
            (error.name === 'SequelizeUniqueConstraintError' ? 409 : 500)
        ).json({
            mensaje: error.statusCode
                ? error.message
                : error.name === 'SequelizeUniqueConstraintError'
                    ? 'Ya tenés un viaje en curso'
                    : 'Error al asignar los pedidos',
        });
    }
};

const iniciarViaje = async (req, res) => {
    const { id: repartidorId } = req.repartidor;

    const transaction = await Viaje.sequelize.transaction();

    try {
        // Buscar el viaje que está preparando el repartidor y bloquearlo.
        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: 'preparando',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            const error = new Error(
                'No tenés un viaje en preparación para iniciar'
            );
            error.statusCode = 404;
            throw error;
        }

        // Comprobar que el viaje tenga pedidos asociados.
        const cantidadPedidos = await Pedido.count({
            where: {
                viajeId: viaje.id,
            },
            transaction,
        });

        if (cantidadPedidos === 0) {
            const error = new Error(
                'No podés iniciar un viaje sin pedidos'
            );
            error.statusCode = 409;
            throw error;
        }

        // Comprobar que todos los pedidos hayan sido retirados.
        const pedidosSinRetirar = await Pedido.count({
            where: {
                viajeId: viaje.id,
                estado: 'Listo para retirar',
            },
            transaction,
        });

        if (pedidosSinRetirar > 0) {
            const error = new Error(
                'Todavía tenés pedidos pendientes de retirar'
            );
            error.statusCode = 409;
            throw error;
        }

        // Iniciar el viaje.
        await viaje.update(
            {
                estado: 'activo',
                fechaInicio: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            mensaje: 'Viaje iniciado correctamente',
            viaje: {
                id: viaje.id,
                repartidorId: viaje.repartidorId,
                fechaInicio: viaje.fechaInicio,
                estado: viaje.estado,
            },
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error('Error al iniciar viaje:', error.message);

        return res.status(error.statusCode || 500).json({
            mensaje: error.statusCode
                ? error.message
                : 'Error al iniciar el viaje',
        });
    }
};

const quitarPedidoDelViaje = async (req, res) => {
    const { id: repartidorId } = req.repartidor;
    const pedidoId = Number(req.params.pedidoId);

    if (!Number.isInteger(pedidoId) || pedidoId <= 0) {
        return res.status(400).json({
            mensaje: 'El identificador del pedido no es válido',
        });
    }

    const transaction = await Viaje.sequelize.transaction();

    try {
        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: 'preparando',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            const error = new Error(
                'No tenés un viaje en preparación'
            );
            error.statusCode = 404;
            throw error;
        }

        const pedido = await Pedido.findOne({
            where: {
                id: pedidoId,
                viajeId: viaje.id,
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!pedido) {
            const error = new Error(
                'El pedido no pertenece a tu viaje'
            );
            error.statusCode = 404;
            throw error;
        }

        if (pedido.estado !== 'Listo para retirar') {
            const error = new Error(
                'No podés quitar un pedido que ya fue retirado o modificado'
            );
            error.statusCode = 409;
            throw error;
        }

        await pedido.update(
            { viajeId: null },
            { transaction }
        );

        const pedidosRestantes = await Pedido.count({
            where: {
                viajeId: viaje.id,
            },
            transaction,
        });

        // Si era el último pedido, cancelar automáticamente el viaje.
        if (pedidosRestantes === 0) {
            await viaje.destroy({ transaction });
        }

        await transaction.commit();

        return res.status(200).json({
            mensaje: pedidosRestantes === 0
                ? 'Pedido quitado. El viaje quedó vacío y fue eliminado'
                : 'Pedido quitado correctamente. Ya está disponible para otros repartidores',
            pedidoId: pedido.id,
            pedidosRestantes,
            viajeEliminado: pedidosRestantes === 0,
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error('Error al quitar pedido del viaje:', error.message);

        return res.status(error.statusCode || 500).json({
            mensaje: error.statusCode
                ? error.message
                : 'Error al quitar el pedido del viaje',
        });
    }
};

const obtenerViajeActivo = async (req, res) => {
    try {
        const { id: repartidorId } = req.repartidor;

        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: {[Op.in]: ['preparando', 'activo', 'requiere asistencia']}
                
            },
            include: [
                {
                    model: Pedido,
                    include: [
                        {
                            model: Usuario,
                            attributes: ['id', 'nombre', 'apellido', 'telefono'],
                        },
                        {
                            model: Direccion,
                            attributes: [
                                'id', 'alias', 'calle', 'numero', 'piso',
                                'localidad', 'provincia', 'observaciones',
                                'latitud', 'longitud',
                            ],
                            paranoid: false,
                        },
                        {
                            model: DetallePedido,
                            include: [
                                {
                                    model: Producto,
                                    attributes: ['id', 'nombre', 'imagen'],
                                    paranoid: false,
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        return res.status(200).json(viaje);

    } catch (error) {
        console.error('Error al obtener viaje activo:', error.message);

        return res.status(500).json({
            mensaje: 'Error al obtener el viaje activo',
        });
    }
};

const obtenerHistorialViajes = async (req, res) => {
    try {
        const { id: repartidorId } = req.repartidor;

        const viajes = await Viaje.findAll({
            where: {
                repartidorId,
                estado: 
                {[Op.in]: ['finalizado', 'cancelado']}
            },
            include: [
                {
                    model: Pedido,
                    include: [
                        {
                            model: Usuario,
                            attributes: ['id', 'nombre', 'apellido', 'telefono'],
                        },
                        {
                            model: Direccion,
                            attributes: [
                                'id', 'alias', 'calle', 'numero', 'piso',
                                'localidad', 'provincia', 'observaciones',
                                'latitud', 'longitud',
                            ],
                            paranoid: false,
                        },
                        {
                            model: DetallePedido,
                            include: [
                                {
                                    model: Producto,
                                    attributes: ['id', 'nombre', 'imagen'],
                                    paranoid: false,
                                },
                            ],
                        },
                    ],
                },
            ],
            order: [['fechaInicio', 'DESC']],
        });

        return res.status(200).json(viajes);

    } catch (error) {
        console.error('Error al obtener historial de viajes:', error.message);

        return res.status(500).json({
            mensaje: 'Error al obtener el historial de viajes',
        });
    }
};

const solicitarAyuda = async (req, res) => {
    const { id: repartidorId } = req.repartidor;
    const { motivo, comentario } = req.body;

    const motivosValidos = [
        'Problema con el vehículo',
        'Accidente',
        'Problema personal',
        'Otro',
    ];

    if (!motivosValidos.includes(motivo)) {
        return res.status(400).json({
            mensaje: 'Debés seleccionar un motivo válido',
        });
    }

    if (
        comentario !== undefined &&
        (typeof comentario !== 'string' || comentario.trim().length > 500)
    ) {
        return res.status(400).json({
            mensaje: 'El comentario debe tener como máximo 500 caracteres',
        });
    }

    const transaction = await Viaje.sequelize.transaction();

    try {
        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: 'activo',
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            await transaction.rollback();

            return res.status(404).json({
                mensaje: 'No tenés un viaje activo para solicitar asistencia',
            });
        }

        await viaje.update(
            {
                estado: 'requiere asistencia',
                motivoAsistencia: motivo,
                comentarioAsistencia: comentario?.trim() || null,
                fechaSolicitudAsistencia: new Date(),
            },
            { transaction }
        );

        await transaction.commit();

        return res.status(200).json({
            mensaje: 'Solicitud de asistencia enviada correctamente',
            viaje: {
                id: viaje.id,
                estado: viaje.estado,
                motivoAsistencia: viaje.motivoAsistencia,
                comentarioAsistencia: viaje.comentarioAsistencia,
                fechaSolicitudAsistencia: viaje.fechaSolicitudAsistencia,
            },
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error('Error al solicitar asistencia:', error.message);

        return res.status(500).json({
            mensaje: 'Error al enviar la solicitud de asistencia',
        });
    }
};

module.exports = {
    iniciarViaje, obtenerViajeActivo, obtenerHistorialViajes, solicitarAyuda, tomarPedidos, quitarPedidoDelViaje
}