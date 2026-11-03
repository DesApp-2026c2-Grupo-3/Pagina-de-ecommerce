const { literal } = require('sequelize');
const { Categoria, Producto, sequelize } = require("../../models");

// Los complementos (salsas) van siempre al final; el resto, por el orden que defina el master
const ORDEN_CATEGORIAS = [['esComplemento', 'ASC'], ['orden', 'ASC'], ['id', 'ASC']];
const PASO_ORDEN = 10;

const CANTIDAD_PRODUCTOS = literal(
    '(SELECT COUNT(*)::int FROM "Productos" p WHERE p."categoriaId" = "Categoria"."id" AND p."deletedAt" IS NULL)'
);

// Ícono y color solo se tocan si llegan (null los devuelve a los que corresponden al nombre)
const estiloDe = (body) => ({
    ...(body.icono !== undefined ? { icono: body.icono } : {}),
    ...(body.fondo !== undefined ? { fondo: body.fondo } : {}),
});

// Orden de una categoría nueva: al final de sus hermanas
const siguienteOrden = async (categoriaPadreId) => {
    const ultimo = await Categoria.max('orden', { where: { categoriaPadreId, esComplemento: false } });
    return (Number(ultimo) || 0) + PASO_ORDEN;
};

// Un solo nivel: la categoría padre tiene que ser principal y no tener productos propios.
// Devuelve el motivo del rechazo, o null si está bien.
const motivoPadreInvalido = async (categoriaPadreId, idActual) => {
    if (categoriaPadreId === null || categoriaPadreId === undefined) return null;
    if (idActual !== null && Number(categoriaPadreId) === Number(idActual)) {
        return 'Una categoría no puede ser su propia categoría padre';
    }

    const padre = await Categoria.findByPk(categoriaPadreId);
    if (!padre) return 'La categoría padre no existe';
    if (padre.categoriaPadreId !== null) {
        return `"${padre.nombre}" ya depende de otra categoría: solo se permite un nivel`;
    }
    if (await Producto.count({ where: { categoriaId: padre.id } }) > 0) {
        return `"${padre.nombre}" tiene productos: pasalos a otra categoría antes de usarla como padre`;
    }
    if (idActual !== null && await Categoria.count({ where: { categoriaPadreId: idActual } }) > 0) {
        return 'Esta categoría tiene subcategorías, así que no puede depender de otra';
    }
    return null;
};

const obtenerCategorias = async (req, res) => {
    try {
        // Siempre con orden explícito: sin él, Postgres puede devolverlas en otro orden después de un UPDATE
        // cantidadProductos: el panel la usa para mostrar el Home como lo ve el cliente (sin categorías vacías)
        const categoria = await Categoria.findAll({
            attributes: { include: [[CANTIDAD_PRODUCTOS, 'cantidadProductos']] },
            order: ORDEN_CATEGORIAS
        });
        return res.json(categoria);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener las categorias' });
    }
};

const crearCategoria = async (req, res) => {
    try {
        const { nombre, categoriaPadreId = null, esComplemento = false } = req.body;

        const motivo = await motivoPadreInvalido(categoriaPadreId, null);
        if (motivo) {
            return res.status(400).json({ mensaje: motivo });
        }

        const orden = req.body.orden ?? await siguienteOrden(categoriaPadreId);

        const nuevaCategoria = await Categoria.create({
            nombre,
            categoriaPadreId,
            orden,
            esComplemento,
            ...estiloDe(req.body)
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

        const { nombre, categoriaPadreId, orden, esComplemento } = req.body;

        // Solo se cambia lo que llega: editar el nombre no mueve la categoría de lugar
        const cambios = { nombre };
        if (categoriaPadreId !== undefined) {
            const motivo = await motivoPadreInvalido(categoriaPadreId, categoria.id);
            if (motivo) {
                return res.status(400).json({ mensaje: motivo });
            }
            cambios.categoriaPadreId = categoriaPadreId;
        }
        if (orden !== undefined) cambios.orden = orden;
        if (esComplemento !== undefined) cambios.esComplemento = esComplemento;
        Object.assign(cambios, estiloDe(req.body));

        const categoriaActualizada = await categoria.update(cambios);

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

        if (await Categoria.count({ where: { categoriaPadreId: categoria.id } }) > 0) {
            return res.status(400).json({
                mensaje: 'La categoría tiene subcategorías: eliminalas o movelas antes'
            });
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
        // Lista plana (con categoriaPadreId y orden) de las categorías activas que tienen productos,
        // más las principales que no tienen productos propios pero sí en alguna de sus hijas (Cafetería)
        const categorias = await Categoria.findAll({
            where: {
                activo: true
            },
            attributes: {
                include: [[
                    literal('(SELECT COUNT(*) FROM "Productos" p WHERE p."categoriaId" = "Categoria"."id" AND p."deletedAt" IS NULL)'),
                    'cantidadProductos'
                ]]
            },
            order: ORDEN_CATEGORIAS,
            raw: true
        });

        const conProductos = new Set(categorias.filter((c) => Number(c.cantidadProductos) > 0).map((c) => c.id));
        const padresConProductosEnHijas = new Set(
            categorias.filter((c) => c.categoriaPadreId !== null && conProductos.has(c.id)).map((c) => c.categoriaPadreId)
        );

        return res.json(
            categorias
                .filter((c) => conProductos.has(c.id) || padresConProductosEnHijas.has(c.id))
                .map(({ cantidadProductos, ...categoria }) => categoria)
        );
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            mensaje: 'Error al obtener las categorías del catálogo'
        });
    }
};

// PATCH /admin/categorias/orden  { ids: [3, 1, 2] } → deja las categorías en ese orden (10, 20, 30...)
const ordenarCategorias = async (req, res) => {
    try {
        const { ids } = req.body ?? {};
        const validos = Array.isArray(ids)
            && ids.length > 0
            && ids.every((id) => Number.isInteger(id) && id > 0)
            && new Set(ids).size === ids.length;
        if (!validos) {
            return res.status(400).json({ mensaje: 'Mandá la lista de categorías, sin repetir, en el orden deseado' });
        }

        const existentes = await Categoria.findAll({ where: { id: ids }, attributes: ['id'] });
        if (existentes.length !== ids.length) {
            return res.status(404).json({ mensaje: 'Alguna de las categorías no existe' });
        }

        await sequelize.transaction(async (transaction) => {
            for (const [indice, id] of ids.entries()) {
                await Categoria.update({ orden: (indice + 1) * PASO_ORDEN }, { where: { id }, transaction });
            }
        });

        return res.status(200).json({ mensaje: 'Orden actualizado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al ordenar las categorías' });
    }
};

module.exports = {
    obtenerCategorias,
    ordenarCategorias,
    crearCategoria,
    eliminarCategorias,
    editarCategoriaPorId,
    deshabilitarCategoria,
    habilitarCategoria,
    obtenerCategoriasCliente
};