const { Producto, RecetaInsumo, Insumo, ProductoVariante, StockSucursal, Sucursal } = require('../models');
const {
    agruparPorProducto,
    stockComoMapa,
    productoDisponible,
    pasoExtra,
} = require('../utils/disponibilidad');

const VARIANTES = { model: ProductoVariante, as: 'variantes', attributes: ['tamanio', 'precio', 'etiqueta'] };

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

// Lee ?sucursalId de la URL:
// - sin sucursalId → { sucursalId: null } (se responde como siempre)
// - inválido o inexistente → { error } con el status y el mensaje
async function sucursalDesdeQuery(query) {
    if (query.sucursalId === undefined) return { sucursalId: null };

    const sucursalId = Number(query.sucursalId);
    if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
        return { error: { status: 400, mensaje: 'La sucursal no es válida' } };
    }

    const sucursal = await Sucursal.findByPk(sucursalId);
    if (!sucursal || !sucursal.activa) {
        return { error: { status: 404, mensaje: 'Sucursal no encontrada' } };
    }

    return { sucursalId };
}

// GET /productos                → catálogo con el "disponible" manual (como siempre)
// GET /productos?sucursalId=2   → "disponible" calculado con el stock de esa sucursal
const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({ include: [VARIANTES] });

        const { sucursalId, error } = await sucursalDesdeQuery(req.query);
        if (error) return res.status(error.status).json({ mensaje: error.mensaje });
        if (!sucursalId) return res.json(productos);

        // Dos consultas en total, no una por producto
        const [recetas, stock] = await Promise.all([
            RecetaInsumo.findAll({ attributes: ['productoId', 'insumoId', 'cantidadBase'] }),
            StockSucursal.findAll({ where: { sucursalId }, attributes: ['insumoId', 'cantidad'] }),
        ]);

        const recetasPorProducto = agruparPorProducto(recetas);
        const stockPorInsumo = stockComoMapa(stock);

        res.json(productos.map((producto) => {
            const datos = producto.toJSON();
            return {
                ...datos,
                disponible: productoDisponible(datos, recetasPorProducto.get(datos.id), stockPorInsumo),
            };
        }));
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener los productos' });
    }
};

// GET /productos/:id               → producto con su receta (como siempre)
// GET /productos/:id?sucursalId=2  → además, disponibilidad y stock de cada ingrediente
const obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findByPk(req.params.id, {
            include: [{ model: RecetaInsumo, include: [Insumo] }, VARIANTES]
        });

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const productoJson = producto.toJSON();
        const { RecetaInsumos, ...datosProducto } = productoJson;
        const ingredientes = mapIngredientes(productoJson);

        const { sucursalId, error } = await sucursalDesdeQuery(req.query);
        if (error) return res.status(error.status).json({ mensaje: error.mensaje });
        if (!sucursalId) return res.json({ ...datosProducto, ingredientes });

        // Solo el stock de los insumos de esta receta, en esta sucursal
        const stock = await StockSucursal.findAll({
            where: { sucursalId, insumoId: ingredientes.map((i) => i.insumoId) },
            attributes: ['insumoId', 'cantidad'],
        });
        const stockPorInsumo = stockComoMapa(stock);

        res.json({
            ...datosProducto,
            disponible: productoDisponible(datosProducto, ingredientes, stockPorInsumo),
            ingredientes: ingredientes.map((ing) => {
                const hay = stockPorInsumo.get(ing.insumoId) ?? 0;
                return {
                    ...ing,
                    // Alcanza para la receta
                    hayStock: hay >= ing.cantidadBase,
                    // Alcanza además para un extra (solo si se puede agregar)
                    hayStockExtra: ing.esAgregable && hay >= ing.cantidadBase + pasoExtra(ing.cantidadBase),
                };
            }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error al obtener el producto' });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId
};