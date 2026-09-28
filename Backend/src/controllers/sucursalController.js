const { Sucursal } = require('../models');

// GET /sucursales → sucursales activas (público: lo usa el mapa de Home)
const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            where: { activa: true },
            attributes: [
                'id',
                'nombre',
                'calle',
                'numero',
                'localidad',
                'provincia',
                'codigoPostal',
                'telefono',
                'horario',
                'latitud',
                'longitud',
                'radioEntregaKm',
            ],
            order: [['nombre', 'ASC']],
        });

        res.json(sucursales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener las sucursales' });
    }
};

module.exports = {
    obtenerSucursales,
};
