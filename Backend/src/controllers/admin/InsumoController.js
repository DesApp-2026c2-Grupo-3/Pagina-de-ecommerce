const { Insumo } = require('../../models');

// GET /admin/insumos → para elegir los ingredientes de una receta
const obtenerInsumos = async (req, res) => {
    try {
        const insumos = await Insumo.findAll({
            attributes: ['id', 'nombre', 'unidadMedida', 'precioComercial'],
            order: [['nombre', 'ASC']],
        });
        res.json(insumos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los insumos' });
    }
};

module.exports = { obtenerInsumos };