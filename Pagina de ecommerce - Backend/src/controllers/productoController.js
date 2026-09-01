const {Producto} = require('../models');

const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            where: {
                disponible: true
            }
        });

        res.json(productos);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener los productos'
        });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        res.json(producto);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensaje: 'Error al obtener el producto'
        });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId
};