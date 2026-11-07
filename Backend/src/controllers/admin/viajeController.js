const {
    Viaje,
    Pedido,
    Repartidor,
    Usuario,
    Admin,
    Sucursal,
} = require('../../models');

const { Op } = require('sequelize');

// El MASTER puede consultar cualquier sucursal;
// el administrador común, solamente la propia.
function puedeVerSucursal(admin, sucursalId) {
    return admin.sucursalId === null ||
        Number(admin.sucursalId) === Number(sucursalId);
}

// GET /admin/viajes/sucursal/:id
const obtenerViajesPorSucursal = async (req, res) => {
    try {
        // Verificar que el administrador exista
        const admin = await Admin.findByPk(req.usuario.id);

        if (!admin) {
            return res.status(401).json({
                mensaje: 'Iniciá sesión de nuevo',
            });
        }

        // Verificar que la sucursal exista
        const sucursal = await Sucursal.findByPk(req.params.id);

        if (!sucursal) {
            return res.status(404).json({
                mensaje: 'Sucursal no encontrada',
            });
        }

        // Verificar permisos
        if (!puedeVerSucursal(admin, sucursal.id)) {
            return res.status(403).json({
                mensaje: 'No tienes permisos para acceder a esta sucursal',
            });
        }

        // Buscar los viajes de los repartidores de esa sucursal
        const viajes = await Viaje.findAll({
            include: [
                {
                    model: Repartidor,
                    attributes: ['id', 'nombre', 'apellido'],
                    where: {
                        sucursalId: sucursal.id,
                    },
                    required: true,
                },
                {
                    model: Pedido,
                    attributes: [
                        'id',
                        'fecha',
                        'estado',
                        'total',
                    ],
                    include: [
                        {
                            model: Usuario,
                            attributes: ['id', 'nombre', 'apellido'],
                        },
                    ],
                },
            ],
            order: [['fechaInicio', 'DESC']],
        });

        return res.status(200).json(viajes);

    } catch (error) {
        console.error('Error al obtener los viajes:', error.message);

        return res.status(500).json({
            mensaje: 'Error al obtener los viajes',
        });
    }
};



const reasignarViaje = async (req, res) => {
    try {
        const { id } = req.params;
        const { repartidorId } = req.body;

        if (!Number.isInteger(Number(repartidorId)) || Number(repartidorId) <= 0) {
            return res.status(400).json({
                mensaje: 'Seleccioná un repartidor válido',
            });
        }

        const nuevoRepartidorId = Number(repartidorId);

        const resultado = await Viaje.sequelize.transaction(async (transaction) => {
            // Verificar que el administrador exista.
            const admin = await Admin.findByPk(req.usuario.id, {
                transaction,
            });

            if (!admin) {
                return {
                    status: 401,
                    mensaje: 'Iniciá sesión de nuevo',
                };
            }

            // Bloquear el viaje para evitar reasignaciones simultáneas.
            const viaje = await Viaje.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });

            if (!viaje) {
                return {
                    status: 404,
                    mensaje: 'Viaje no encontrado',
                };
            }

            if (viaje.estado !== 'requiere asistencia') {
                return {
                    status: 400,
                    mensaje: 'El viaje ya no requiere asistencia',
                };
            }

            // Obtener la sucursal del repartidor actual.
            const repartidorActual = await Repartidor.findByPk(
                viaje.repartidorId,
                { transaction }
            );

            if (!repartidorActual) {
                return {
                    status: 404,
                    mensaje: 'No se encontró el repartidor actual del viaje',
                };
            }

            const sucursalId = repartidorActual.sucursalId;

            // Verificar permisos del administrador.
            if (
                admin.sucursalId !== null &&
                Number(admin.sucursalId) !== Number(sucursalId)
            ) {
                return {
                    status: 403,
                    mensaje: 'No tenés permisos para reasignar este viaje',
                };
            }

            // Buscar y bloquear al nuevo repartidor.
            const nuevoRepartidor = await Repartidor.findByPk(
                nuevoRepartidorId,
                {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                }
            );

            if (!nuevoRepartidor) {
                return {
                    status: 404,
                    mensaje: 'El repartidor seleccionado no existe',
                };
            }

            if (!nuevoRepartidor.activo) {
                return {
                    status: 400,
                    mensaje: 'El repartidor seleccionado está inactivo',
                };
            }

            if (
                Number(nuevoRepartidor.sucursalId) !== Number(sucursalId)
            ) {
                return {
                    status: 400,
                    mensaje: 'El repartidor pertenece a otra sucursal',
                };
            }

            // Comprobar que no tenga otro viaje en curso.
            const viajeExistente = await Viaje.findOne({
                where: {
                    repartidorId: nuevoRepartidor.id,
                    estado: {
                        [Op.in]: [
                            'preparando',
                            'activo',
                            'requiere asistencia',
                        ],
                    },
                },
                transaction,
            });

            if (viajeExistente) {
                return {
                    status: 409,
                    mensaje: 'El repartidor seleccionado ya tiene un viaje en curso',
                };
            }

            // Reasignar el viaje existente.
            await viaje.update(
                {
                    repartidorId: nuevoRepartidor.id,
                    estado: 'activo',
                },
                { transaction }
            );

            return {
                status: 200,
                mensaje: 'Viaje reasignado correctamente',
                viaje: {
                    id: viaje.id,
                    repartidorId: nuevoRepartidor.id,
                    estado: viaje.estado,
                    Repartidor: {
                        id: nuevoRepartidor.id,
                        nombre: nuevoRepartidor.nombre,
                        apellido: nuevoRepartidor.apellido,
                    },
                },
            };
        });

        return res.status(resultado.status).json(resultado);

    } catch (error) {
        console.error('Error al reasignar el viaje:', error);

        return res.status(500).json({
            mensaje: 'Error al reasignar el viaje',
        });
    }
};


module.exports = {
    obtenerViajesPorSucursal,
    reasignarViaje
};