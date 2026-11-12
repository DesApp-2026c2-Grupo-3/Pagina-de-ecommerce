const {
    Pedido,
    DetallePedido,
    Producto,
    Usuario,
    Direccion,
    Viaje,
    historialDeTiemposPedido,
} = require('../../models');

const { Op } = require('sequelize');

const obtenerPedidosDisponibles = async (req, res) => {
    try {
        const { sucursalId } = req.repartidor;

        const pedidos = await Pedido.findAll({
            where: {
                sucursalId,
                estado: 'Listo para retirar',
                viajeId: null,
            },
            include: [
                {
                    model: Usuario,
                    attributes: [
                        'id',
                        'nombre',
                        'apellido',
                        'telefono',
                    ],
                },
                {
                    model: Direccion,
                    attributes: [
                        'id',
                        'alias',
                        'calle',
                        'numero',
                        'piso',
                        'localidad',
                        'provincia',
                        'observaciones',
                        'latitud',
                        'longitud',
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
            order: [['fecha', 'ASC']],
        });

        return res.status(200).json(pedidos);

    } catch (error) {
        console.error(
            'Error al obtener pedidos disponibles:',
            error.message
        );

        return res.status(500).json({
            mensaje: 'Error al obtener los pedidos disponibles',
        });
    }
};

const actualizarEstadoPedido = async (req, res) => {
    const { pedidoId } = req.params;
    const { estado } = req.body;
    const { id: repartidorId } = req.repartidor;

    const TRANSICIONES = {
        'Listo para retirar': ['En camino'],
        'En camino': ['Entregado'],
    };

    const ESTADOS_FINALES = ['Entregado', 'Cancelado'];

    const transaction = await Pedido.sequelize.transaction();

    try {
        // Buscar el viaje activo del repartidor y bloquearlo.
        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: {[Op.in]:['preparando', 'activo']},
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            const error = new Error('No tenés un viaje activo');
            error.statusCode = 404;
            throw error;
        }

        // Buscar el pedido dentro de ese viaje y bloquearlo.
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
                'El pedido no pertenece a tu viaje activo'
            );
            error.statusCode = 404;
            throw error;
        }

        // Validar que la acción corresponda al estado actual del viaje.
        if ( pedido.estado === 'Listo para retirar' && viaje.estado !== 'preparando') 
            {const error = new Error(
                'Solo podés retirar pedidos mientras preparás el viaje'
                );
                error.statusCode = 409;
                throw error;
            }

        if (pedido.estado === 'En camino' && viaje.estado !== 'activo') 
            {const error = new Error(
                'Primero debés iniciar el viaje para entregar pedidos'
                );
                error.statusCode = 409;
                throw error;
            }

        // Comprobar que la transición esté permitida.
        const estadosPermitidos = TRANSICIONES[pedido.estado];

        if (!estadosPermitidos || !estadosPermitidos.includes(estado)) {
            const error = new Error(
                `No se puede cambiar el pedido de "${pedido.estado}" a "${estado}"`
            );
            error.statusCode = 400;
            throw error;
        }

        const estadoAnterior = pedido.estado;

        // Actualizar el estado.
        await pedido.update(
            { estado },
            { transaction }
        );

        // Registrar el cambio en el historial.
        await historialDeTiemposPedido.create(
            {
                pedidoId: pedido.id,
                estadoAnterior,
                estado,
                fecha: new Date(),
            },
            { transaction }
        );

        // Comprobar si quedan pedidos sin finalizar en el viaje.
        const pedidosPendientes = await Pedido.count({
            where: {
                viajeId: viaje.id,
                estado: {
                    [Op.notIn]: ESTADOS_FINALES,
                },
            },
            transaction,
        });

        // Si todos están entregados o cancelados, cerrar el viaje.
        if (pedidosPendientes === 0) {
            await viaje.update(
                {
                    estado: 'finalizado',
                    fechaFin: new Date(),
                },
                { transaction }
            );
        }

        await transaction.commit();

        return res.status(200).json({
            mensaje: 'Estado del pedido actualizado correctamente',
            pedido: {
                id: pedido.id,
                estado: pedido.estado,
            },
            viajeFinalizado: pedidosPendientes === 0,
        });

    } catch (error) {
        await transaction.rollback();

        console.error(
            'Error al actualizar estado del pedido:',
            error.message
        );

        return res.status(error.statusCode || 500).json({
            mensaje: error.statusCode
                ? error.message
                : 'Error al actualizar el estado del pedido',
        });
    }
};


module.exports = {
    obtenerPedidosDisponibles, actualizarEstadoPedido
};