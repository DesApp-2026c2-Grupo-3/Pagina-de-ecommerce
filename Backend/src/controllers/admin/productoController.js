const {
    Producto,
    RecetaInsumo,
    Insumo,
    ProductoTamanio,
    Tamanio,
    ComboGrupo,
    Sucursal,
    StockSucursal,
    sequelize,
} = require('../../models');
const { factorMinimo } = require('../../utils/disponibilidad');

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

// Borrado lógico: el producto deja de verse en el panel y en la tienda,
// pero se conserva para los pedidos que ya lo tienen
const eliminarProducto = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        // No se puede eliminar la opción incluida de un combo que sigue a la venta
        const enCombos = await ComboGrupo.count({
            where: { productoIncluidoId: producto.id },
            include: [{ model: Producto, as: 'combo', required: true }],
        });
        if (enCombos > 0) {
            return res.status(409).json({
                mensaje: 'Este producto es la opción incluida de un combo. Cambiá ese combo antes de eliminarlo.'
            });
        }

        await producto.destroy();
        return res.status(200).json({ mensaje: 'Producto eliminado. Los pedidos anteriores lo conservan.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al eliminar el producto' });
    }
};
// GET /admin/productos/:id/stock → por sucursal, cuántas unidades se pueden preparar con el stock actual
const verStockProducto = async (req, res) => {
    try {
        const producto = await buscarCompleto(req.params.id);
        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const datos = formatear(producto);
        const sucursales = await Sucursal.findAll({
            where: { activa: true },
            attributes: ['id', 'nombre'],
            order: [['nombre', 'ASC']],
        });

        const receta = datos.receta.filter((r) => r.cantidadBase > 0);
        if (receta.length === 0) {
            return res.json({
                id: datos.id,
                nombre: datos.nombre,
                sinReceta: true,
                sucursales: sucursales.map((s) => ({ id: s.id, nombre: s.nombre, unidades: null, limitante: null })),
            });
        }

        // Igual que en la tienda: un combo no agranda su receta; el resto, por su tamaño más chico
        const factor = datos.grupos.length > 0 ? 1 : factorMinimo(datos.tamanios);

        const stock = await StockSucursal.findAll({
            where: { insumoId: receta.map((r) => r.insumoId), sucursalId: sucursales.map((s) => s.id) },
            attributes: ['insumoId', 'sucursalId', 'cantidad'],
        });
        const cantidadDe = (sucursalId, insumoId) =>
            Number(stock.find((s) => s.sucursalId === sucursalId && s.insumoId === insumoId)?.cantidad ?? 0);

        res.json({
            id: datos.id,
            nombre: datos.nombre,
            sinReceta: false,
            sucursales: sucursales.map((s) => {
                // Lo que se puede preparar lo define el insumo que alcanza para menos unidades
                let unidades = Infinity;
                let limitante = null;
                for (const r of receta) {
                    const posibles = Math.floor(cantidadDe(s.id, r.insumoId) / (r.cantidadBase * factor));
                    if (posibles < unidades) {
                        unidades = posibles;
                        limitante = r.nombre;
                    }
                }
                return { id: s.id, nombre: s.nombre, unidades, limitante };
            }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el stock del producto' });
    }
};
module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    eliminarProducto,
    editarProductoPorId,
    verStockProducto,
};