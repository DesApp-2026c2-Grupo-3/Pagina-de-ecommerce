const { Tamanio } = require('../models');

// GET /tamanios → regular, mediano, grande, en orden
const obtenerTamanios = async (req, res) => {
    try {
        const tamanios = await Tamanio.findAll({
            attributes: ['id', 'nombre', 'orden'],
            order: [['orden', 'ASC']],
        });
        res.json(tamanios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los tamaños' });
    }
};

module.exports = { obtenerTamanios };