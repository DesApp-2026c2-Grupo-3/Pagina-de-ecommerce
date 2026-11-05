const {
    Viaje,
    Pedido,
    Repartidor,
    Usuario,
    Admin,
    Sucursal,
} = require('../../models');

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

module.exports = {
    obtenerViajesPorSucursal,
};