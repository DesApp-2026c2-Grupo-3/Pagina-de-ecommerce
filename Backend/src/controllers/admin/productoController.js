const {
    Producto,
    RecetaInsumo,
    Insumo,
    ProductoTamanio,
    Tamanio,
    ComboGrupo,
    DetallePedido,
    sequelize,
} = require('../../models');

// Todo lo que compone un producto
const INCLUIR_PARTES = [
    { model: RecetaInsumo, include: [{ model: Insumo, attributes: ['id', 'nombre', 'unidadMedida'] }] },
    { model: ProductoTamanio, as: 'tamanios', include: [{ model: Tamanio, attributes: ['nombre', 'orden'] }] },
    { model: ComboGrupo, as: 'grupos' },
];

// El producto como lo necesita el panel: receta, tamaños y grupos ordenados y con nombres
function formatear(producto) {
    const { RecetaInsumos = [], tamanios = [], grupos = [], ...datos } = producto.toJSON();

    return {
        ...datos,
        receta: RecetaInsumos.map((r) => ({
            insumoId: r.insumoId,
            nombre: r.Insumo ? r.Insumo.nombre : null,
            unidadMedida: r.Insumo ? r.Insumo.unidadMedida : null,
            cantidadBase: Number(r.cantidadBase),
            esRemovible: r.esRemovible,
            esAgregable: r.esAgregable,
        })),
        tamanios: tamanios
            .map((t) => ({
                tamanioId: t.tamanioId,
                tamanio: t.Tamanio ? t.Tamanio.nombre : null,
                orden: t.Tamanio ? t.Tamanio.orden : 0,
                precio: Number(t.precio),
                etiqueta: t.etiqueta,
                factorStock: Number(t.factorStock),
            }))
            .sort((a, b) => a.orden - b.orden)
            .map(({ orden, ...resto }) => resto),
        grupos: [...grupos].sort((a, b) => a.orden - b.orden),
    };
}

// Controles que necesitan la base: que lo referenciado exista y tenga sentido.
// Devuelve el mensaje de error, o '' si está todo bien.
async function validarPartes({ receta, tamanios, grupos }, idPropio = null) {
    if (receta && receta.length > 0) {
        const ids = receta.map((r) => r.insumoId);
        const existentes = await Insumo.count({ where: { id: ids } });
        if (existentes !== ids.length) return 'Alguno de los insumos de la receta no existe';
    }

    if (tamanios && tamanios.length > 0) {
        const ids = tamanios.map((t) => t.tamanioId);
        const existentes = await Tamanio.count({ where: { id: ids } });
        if (existentes !== ids.length) return 'Alguno de los tamaños no existe';
    }

    for (const grupo of grupos ?? []) {
        if (idPropio && grupo.productoIncluidoId === idPropio) {
            return 'Un combo no puede incluirse a sí mismo';
        }
        const incluido = await Producto.findByPk(grupo.productoIncluidoId, { attributes: ['id', 'categoriaId'] });
        if (!incluido) return `La opción incluida de "${grupo.nombre}" no existe`;
        if (incluido.categoriaId !== grupo.categoriaId) {
            return `La opción incluida de "${grupo.nombre}" tiene que ser de la categoría del grupo`;
        }
    }

    return '';
}

// Reemplaza las partes que vinieron en el pedido. Las que no vinieron (undefined) no se tocan.
async function guardarPartes(productoId, { receta, tamanios, grupos }, transaction) {
    if (receta !== undefined) {
        await RecetaInsumo.destroy({ where: { productoId }, transaction });
        if (receta.length > 0) {
            await RecetaInsumo.bulkCreate(receta.map((r) => ({ ...r, productoId })), { transaction });
        }
    }

    if (tamanios !== undefined) {
        await ProductoTamanio.destroy({ where: { productoId }, transaction });
        if (tamanios.length > 0) {
            await ProductoTamanio.bulkCreate(tamanios.map((t) => ({ ...t, productoId })), { transaction });
        }
    }

    if (grupos !== undefined) {
        await ComboGrupo.destroy({ where: { productoId }, transaction });
        if (grupos.length > 0) {
            await ComboGrupo.bulkCreate(
                grupos.map((g, i) => ({ ...g, orden: g.orden ?? i + 1, productoId })),
                { transaction }
            );
        }
    }
}

async function buscarCompleto(id, transaction) {
    return Producto.findByPk(id, { include: INCLUIR_PARTES, transaction });
}

const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({ include: INCLUIR_PARTES, order: [['id', 'ASC']] });
        return res.json(productos.map(formatear));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener los productos' });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await buscarCompleto(req.params.id);

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        return res.json(formatear(producto));
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener el producto' });
    }
};

// Crea el producto con todas sus partes, o nada si algo falla
const crearProducto = async (req, res) => {
    const { receta = [], tamanios = [], grupos = [], ...datos } = req.body;

    const errorPartes = await validarPartes({ receta, tamanios, grupos });
    if (errorPartes) {
        return res.status(400).json({ code: errorPartes });
    }

    const t = await sequelize.transaction();
    try {
        const nuevo = await Producto.create(datos, { transaction: t });
        await guardarPartes(nuevo.id, { receta, tamanios, grupos }, t);
        await t.commit();

        const completo = await buscarCompleto(nuevo.id);
        return res.status(201).json({ mensaje: 'Producto creado con éxito', producto: formatear(completo) });
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al crear el producto' });
    }
};

// Edita los datos, y reemplaza solo las partes que vienen en el pedido
const editarProductoPorId = async (req, res) => {
    const { receta, tamanios, grupos, ...datos } = req.body;

    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const errorPartes = await validarPartes({ receta, tamanios, grupos }, producto.id);
    if (errorPartes) {
        return res.status(400).json({ code: errorPartes });
    }

    const t = await sequelize.transaction();
    try {
        await producto.update(datos, { transaction: t });
        await guardarPartes(producto.id, { receta, tamanios, grupos }, t);
        await t.commit();

        const completo = await buscarCompleto(producto.id);
        return res.status(200).json({ mensaje: 'Producto editado con éxito', producto: formatear(completo) });
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al editar el producto' });
    }
};

// Borra el producto y sus partes, salvo que ya tenga pedidos o esté incluido en un combo
const eliminarProducto = async (req, res) => {
    const producto = await Producto.findByPk(req.params.id);
    if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const [pedidos, enCombos] = await Promise.all([
        DetallePedido.count({ where: { productoId: producto.id } }),
        ComboGrupo.count({ where: { productoIncluidoId: producto.id } }),
    ]);

    if (pedidos > 0) {
        return res.status(409).json({
            mensaje: 'Este producto ya tiene pedidos, así que no se puede borrar. Podés desactivarlo para que no se venda más.'
        });
    }
    if (enCombos > 0) {
        return res.status(409).json({
            mensaje: 'Este producto es la opción incluida de un combo. Cambiá ese combo antes de borrarlo.'
        });
    }

    const t = await sequelize.transaction();
    try {
        await guardarPartes(producto.id, { receta: [], tamanios: [], grupos: [] }, t);
        await producto.destroy({ transaction: t });
        await t.commit();

        return res.status(200).json({ mensaje: 'Producto eliminado con éxito' });
    } catch (error) {
        await t.rollback();
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    eliminarProducto,
    editarProductoPorId,
};