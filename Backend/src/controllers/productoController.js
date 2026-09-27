const {Producto, RecetaInsumo, Insumo} = require('../models');

function mapIngredientes(producto) {
    const receta = producto.RecetaInsumos || [];

    return receta.map((item) => ({
        insumoId: item.insumoId,
        nombre: item.Insumo ? item.Insumo.nombre : null,
        unidadMedida: item.Insumo ? item.Insumo.unidadMedida : null,
        cantidadBase: Number(item.cantidadBase),
        esRemovible: item.esRemovible,
        esAgregable: item.esAgregable,
        precioComercial: item.Insumo && item.Insumo.precioComercial != null
            ? Number(item.Insumo.precioComercial)
            : 0
    }));
}

const obtenerProductos = async (req, res) => {
    try {
       const productos = await Producto.findAll();
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
        const producto = await Producto.findByPk(req.params.id, {
            include: [{ model: RecetaInsumo, include: [Insumo] }]
        });

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        const productoJson = producto.toJSON();
        const { RecetaInsumos, ...datosProducto } = productoJson;

        res.json({
            ...datosProducto,
            ingredientes: mapIngredientes(productoJson)
        });

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