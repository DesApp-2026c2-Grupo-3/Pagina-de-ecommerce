const { Producto } = require("../../models");

const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll();
        return res.json(productos);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener los productos' });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        return res.json(producto);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener el producto' });
    }
};

const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen, disponible, categoriaId } = req.body;

        const nuevoProducto = await Producto.create({
            nombre,
            descripcion,
            precio,
            imagen,
            disponible,
            categoriaId
        });

        return res.status(201).json({
            mensaje: "Producto creado con éxito",
            producto: nuevoProducto
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al crear el producto' });
    }
};

const editarProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const { nombre, descripcion, precio, imagen, disponible, categoriaId } = req.body;

        const productoActualizado = await producto.update({
            nombre,
            descripcion,
            precio,
            imagen,
            disponible,
            categoriaId
        });

        return res.status(200).json({
            mensaje: "Producto editado con éxito",
            producto: productoActualizado
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al editar el producto' });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;

        const producto = await Producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        await producto.destroy();

        return res.status(200).json({ mensaje: "Producto eliminado con éxito" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    eliminarProducto,
    editarProductoPorId
};