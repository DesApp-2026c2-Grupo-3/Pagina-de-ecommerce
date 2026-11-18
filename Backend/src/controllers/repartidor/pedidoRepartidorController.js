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
const { notificarPedidoRetirado, notificarPedidoEntregado } = require('../../notifications/handlers/viajeHandlers');

const ESTADOS_FINALES = ['Entregado', 'Cancelado'];

function errorConEstado(statusCode, mensaje) {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    return error;
}

// Los errores esperados traen statusCode y su mensaje se muestra; el resto es un 500 genérico
function responderError(res, error, mensajeGenerico) {
    console.error(`${mensajeGenerico}:`, error.message);
    return res.status(error.statusCode || 500).json({
        mensaje: error.statusCode ? error.message : mensajeGenerico,
    });
}

function leerPedidoId(req) {
    const pedidoId = Number(req.params.pedidoId);
    return Number.isInteger(pedidoId) && pedidoId > 0 ? pedidoId : null;
}

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

// PATCH /repartidor/pedidos/:pedidoId/retirar (D-07)
// Registra que el repartidor retiró el pedido del local. El estado NO cambia:
// sigue "Listo para retirar" hasta que inicie el viaje.
const retirarPedido = async (req, res) => {
    const pedidoId = leerPedidoId(req);
    if (!pedidoId) {
        return res.status(400).json({ mensaje: 'El identificador del pedido no es válido' });
    }

    const { id: repartidorId } = req.repartidor;
    const transaction = await Pedido.sequelize.transaction();

    try {
        const viaje = await Viaje.findOne({
            where: { repartidorId, estado: 'preparando' },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            throw errorConEstado(409, 'Solo podés retirar pedidos mientras preparás el viaje');
        }

        const pedido = await Pedido.findOne({
            where: { id: pedidoId, viajeId: viaje.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!pedido) {
            throw errorConEstado(404, 'El pedido no pertenece a tu viaje');
        }

        if (pedido.retiradoEn) {
            throw errorConEstado(409, 'Ya retiraste este pedido');
        }

        if (pedido.estado !== 'Listo para retirar') {
            throw errorConEstado(409, `No podés retirar un pedido "${pedido.estado}"`);
        }

        await pedido.update({ retiradoEn: new Date() }, { transaction });

        await transaction.commit();

        await notificarPedidoRetirado({ pedido });

        return res.status(200).json({
            mensaje: 'Pedido retirado',
            pedido: {
                id: pedido.id,
                estado: pedido.estado,
                retiradoEn: pedido.retiradoEn,
            },
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        return responderError(res, error, 'Error al retirar el pedido');
    }
};

// PATCH /repartidor/pedidos/:pedidoId/entregar
// Pasa un pedido "En camino" a "Entregado". Si era el último pendiente, cierra el viaje.
const entregarPedido = async (req, res) => {
    const pedidoId = leerPedidoId(req);
    if (!pedidoId) {
        return res.status(400).json({ mensaje: 'El identificador del pedido no es válido' });
    }

    const { id: repartidorId } = req.repartidor;
    const transaction = await Pedido.sequelize.transaction();

    try {
        const viaje = await Viaje.findOne({
            where: {
                repartidorId,
                estado: { [Op.in]: ['preparando', 'activo', 'requiere asistencia'] },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!viaje) {
            throw errorConEstado(404, 'No tenés un viaje en curso');
        }

        if (viaje.estado !== 'activo') {
            throw errorConEstado(409, 'Solo podés entregar pedidos con el viaje en marcha');
        }

        // Viaje reasignado: primero hay que confirmar que se recibieron los pedidos (D-07 v2, H5)
        if (!viaje.recepcionConfirmada) {
            throw errorConEstado(409, 'Primero tenés que confirmar que recibiste todos los pedidos');
        }

        const pedido = await Pedido.findOne({
            where: { id: pedidoId, viajeId: viaje.id },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!pedido) {
            throw errorConEstado(404, 'El pedido no pertenece a tu viaje');
        }

        if (pedido.estado !== 'En camino') {
            throw errorConEstado(409, `No podés entregar un pedido "${pedido.estado}"`);
        }

        const estadoAnterior = pedido.estado;
        const ahora = new Date();

        await pedido.update({ estado: 'Entregado' }, { transaction });

        await historialDeTiemposPedido.create({
            pedidoId: pedido.id,
            estadoAnterior,
            estado: 'Entregado',
            fecha: ahora,
        }, { transaction });

        const pedidosPendientes = await Pedido.count({
            where: {
                viajeId: viaje.id,
                estado: { [Op.notIn]: ESTADOS_FINALES },
            },
            transaction,
        });

        if (pedidosPendientes === 0) {
            await viaje.update({ estado: 'finalizado', fechaFin: ahora }, { transaction });
        }

        await transaction.commit();

        await notificarPedidoEntregado({ pedido, estadoAnterior });

        return res.status(200).json({
            mensaje: 'Pedido entregado',
            pedido: {
                id: pedido.id,
                estado: pedido.estado,
            },
            viajeFinalizado: pedidosPendientes === 0,
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        return responderError(res, error, 'Error al entregar el pedido');
    }
};

module.exports = {
    obtenerPedidosDisponibles,
    retirarPedido,
    entregarPedido,
};
