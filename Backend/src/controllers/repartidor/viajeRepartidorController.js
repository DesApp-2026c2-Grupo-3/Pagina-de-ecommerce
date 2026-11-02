const { Op } = require('sequelize');
const { Viaje, Pedido } = require('../../models');

const iniciarViaje = async (req, res) => {
    const { pedidoIds } = req.body;
    const { id: repartidorId, sucursalId } = req.repartidor;

    // Validar que se hayan enviado pedidos
    if (
        !Array.isArray(pedidoIds) ||
        pedidoIds.length === 0 ||
        !pedidoIds.every(id => Number.isInteger(id) && id > 0)
    ) {
        return res.status(400).json({
            mensaje: 'Debés seleccionar al menos un pedido válido',
        });
    }

    // Evitar IDs repetidos
    const idsUnicos = [...new Set(pedidoIds)];

    if (idsUnicos.length !== pedidoIds.length) {
        return res.status(400).json({
            mensaje: 'La selección contiene pedidos duplicados',
        });
    }

    const transaction = await Viaje.sequelize.transaction();

    try {
        // Comprobar que el repartidor no tenga otro viaje activo
        const viajeActivo = await Viaje.findOne({
            where: {
                repartidorId,
                estado: 'activo',
            },
            transaction,
        });

        if (viajeActivo) {
            const error = new Error('Ya tenés un viaje activo');
            error.statusCode = 409;
            throw error;
        }

        // Buscar y bloquear los pedidos seleccionados
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

        // Comprobar que todos los pedidos sean válidos
        if (pedidos.length !== idsUnicos.length) {
            const error = new Error(
                'Uno o más pedidos ya no están disponibles o no pertenecen a tu sucursal'
            );
            error.statusCode = 409;
            throw error;
        }

        // Crear el viaje
        const viaje = await Viaje.create(
            {
                repartidorId,
                fechaInicio: new Date(),
                estado: 'activo',
            },
            { transaction }
        );

        // Asociar los pedidos al viaje
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
            mensaje: 'Viaje iniciado correctamente',
            viaje: {
                id: viaje.id,
                repartidorId: viaje.repartidorId,
                fechaInicio: viaje.fechaInicio,
                estado: viaje.estado,
            },
            pedidoIds: idsUnicos,
        });

    } catch (error) {
        await transaction.rollback();

        console.error('Error al iniciar viaje:', error.message);

        return res.status(error.statusCode || 500).json({
            mensaje: error.statusCode
                ? error.message
                : 'Error al iniciar el viaje',
        });
    }
};

const obtenerViajeActivo = async (req, res) => {
    try {
        const { id: repartidorId } = req.repartidor;

        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: 'activo',
            },
            include: [
                {
                    model: Pedido,
                    include: [
                        {
                            model: require('../../models').Usuario,
                            attributes: ['id', 'nombre', 'apellido', 'telefono'],
                        },
                        {
                            model: require('../../models').Direccion,
                            attributes: [
                                'id', 'alias', 'calle', 'numero', 'piso',
                                'localidad', 'provincia', 'observaciones',
                                'latitud', 'longitud',
                            ],
                            paranoid: false,
                        },
                        {
                            model: require('../../models').DetallePedido,
                            include: [
                                {
                                    model: require('../../models').Producto,
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
module.exports = {
    iniciarViaje, obtenerViajeActivo
};