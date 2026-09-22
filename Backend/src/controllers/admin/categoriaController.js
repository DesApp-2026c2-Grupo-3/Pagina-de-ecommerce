const { Categoria } = require("../../models");

/////////////
const esIdValido = (id) => !isNaN(id) && Number.isInteger(Number(id));

const obtenerCategorias = async (req, res) => {
    try {
        const categoria = await Categoria.findAll();
        return res.json(categoria);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener las categorias' });
    }
};

const crearCategoria = async (req, res) => {
    try {
        const { nombre } = req.body;

        //////
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ mensaje: 'El nombre es obligatorio' });
        }
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

        if (!esIdValido(id)) {
            return res.status(400).json({ mensaje: 'El ID debe ser un número válido' });
        }

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

        if (!esIdValido(id)) {
            return res.status(400).json({ mensaje: 'El ID debe ser un número válido' });
        }

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

module.exports = {
    obtenerCategorias,
    crearCategoria,
    eliminarCategorias,
    editarCategoriaPorId
};