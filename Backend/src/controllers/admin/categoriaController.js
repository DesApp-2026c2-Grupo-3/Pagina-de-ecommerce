const { Categoria, Producto } = require("../../models");

const obtenerCategorias = async (req, res) => {
    try {
        // Siempre por id: sin orden explícito, Postgres puede devolverlas en otro orden después de un UPDATE
        const categoria = await Categoria.findAll({ order: [['id', 'ASC']] });
        return res.json(categoria);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener las categorias' });
    }
};

const crearCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;

        const nuevaCategoria = await Categoria.create({
            nombre
        });

        return res.status(201).json({
            mensaje: "Categoria creada con éxito",
            categoria: nuevaCategoria
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al crear la categoria' });
    }
};

const editarCategoriaPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({ mensaje: 'Categoria no encontrada' });
        }

        const { nombre } = req.body;

        const categoriaActualizada = await categoria.update({
            nombre
        });

        return res.status(200).json({
            mensaje: "Categoria editada con éxito",
            categoria: categoriaActualizada
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al editar la categoria' });
    }
};

const eliminarCategorias = async (req, res) => {
    try {
        const { id } = req.params;

        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({ mensaje: 'Categoria no encontrada' });
        }

        await categoria.destroy();

        return res.status(200).json({ mensaje: "Categoria eliminada con éxito" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar la categoria' });
    }
};


const deshabilitarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                mensaje: 'Categoria no encontrada'
            });
        }

        if (!categoria.activo) {
            return res.status(400).json({
                mensaje: 'La categoria ya está deshabilitada'
            });
        }

        await categoria.update({ activo: false });

        return res.status(200).json({
            mensaje: 'Categoria deshabilitada con éxito',
            categoria
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al deshabilitar la categoria'
        });
    }
};

const habilitarCategoria = async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                mensaje: 'Categoria no encontrada'
            });
        }

        if (categoria.activo) {
            return res.status(400).json({
                mensaje: 'La categoria ya está habilitada'
            });
        }

        await categoria.update({ activo: true });

        return res.status(200).json({
            mensaje: 'Categoria habilitada con éxito',
            categoria
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al habilitar la categoria'
        });
    }
};

const obtenerCategoriasCliente = async (req, res) => {
    try {
        const categorias = await Categoria.findAll({
            where: {
                activo: true
            },
            include: [{
                model: Producto,
                as: 'productos',
                required: true,
                attributes: []
            }],
            order: [['id', 'ASC']]
        });

        return res.json(categorias);
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al obtener las categorías del catálogo'
        });
    }
};

module.exports = {
    obtenerCategorias,
    crearCategoria,
    eliminarCategorias,
    editarCategoriaPorId,
    deshabilitarCategoria,
    habilitarCategoria,
    obtenerCategoriasCliente
};