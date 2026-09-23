const { Sucursal } = require('../models');

const obtenerSucursales = async (req, res) => {
    try {
        const sucursales = await Sucursal.findAll({
            order: [['localidad', 'ASC']],
        });

        res.status(200).json(sucursales);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

module.exports = {
    obtenerSucursales,
};
