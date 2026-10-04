const {
    Producto,
    RecetaInsumo,
    Insumo,
    ProductoTamanio,
    Tamanio,
    ComboGrupo,
    StockSucursal,
    Sucursal,
} = require('../models');
const {
    agruparPorProducto,
    stockComoMapa,
    productoDisponible,
    factorMinimo,
    pasoExtra,
} = require('../utils/disponibilidad');

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

// Los tamaños de un producto, ordenados (regular, mediano, grande) y con el nombre del tamaño:
// [{ tamanioId: 1, tamanio: 'regular', precio: '2100.00', etiqueta: null, factorStock: 1 }]
function mapTamanios(tamanios) {
    return tamanios
        .map((pt) => ({
            tamanioId: pt.tamanioId,
            tamanio: pt.Tamanio ? pt.Tamanio.nombre : null,
            orden: pt.Tamanio ? pt.Tamanio.orden : 0,
            precio: pt.precio,
            etiqueta: pt.etiqueta,
            factorStock: Number(pt.factorStock ?? 1),
        }))
        .sort((a, b) => a.orden - b.orden)
        .map(({ orden, ...resto }) => resto);
}

function incluirTamanios() {
    return {
        model: ProductoTamanio,
        as: 'tamanios',
        attributes: ['tamanioId', 'precio', 'etiqueta', 'factorStock'],
        include: [{ model: Tamanio, attributes: ['nombre', 'orden'] }]
    };
}

// Solo combos: los grupos elegibles (acompañamiento, bebida, ...) del combo
function incluirGrupos() {
    return {
        model: ComboGrupo,
        as: 'grupos',
        attributes: ['id', 'nombre', 'categoriaId', 'productoIncluidoId', 'obligatorio', 'orden', 'icono']
    };
}

function aplanarProducto(producto) {
    const json = typeof producto.toJSON === 'function' ? producto.toJSON() : producto;
    const resultado = Array.isArray(json.tamanios)
        ? { ...json, tamanios: mapTamanios(json.tamanios) }
        : json;
    return Array.isArray(resultado.grupos)
        ? { ...resultado, grupos: [...resultado.grupos].sort((a, b) => a.orden - b.orden) }
        : resultado;
}

// El factor con el que se mide la disponibilidad: un combo no agranda su propia receta
// por tamaño (igual que en crearPedido); el resto usa su tamaño más chico
function factorDe(producto) {
    return producto.grupos?.length ? 1 : factorMinimo(producto.tamanios);
}

// GET /productos                → catálogo con el "disponible" manual (como siempre)
// GET /productos?sucursalId=2   → "disponible" calculado con el stock de esa sucursal
const obtenerProductos = async (req, res) => {
    try {
        const { sucursalId, error } = await sucursalDesdeQuery(req.query);
        if (error) return res.status(error.status).json({ mensaje: error.mensaje });

        const productos = (await Producto.findAll({
            include: [incluirTamanios(), incluirGrupos()],
            order: [['id', 'ASC']]
        })).map(aplanarProducto);

        if (!sucursalId) return res.json(productos);

        // Dos consultas en total, no una por producto
        const [recetas, stock] = await Promise.all([
            RecetaInsumo.findAll({ attributes: ['productoId', 'insumoId', 'cantidadBase'] }),
            StockSucursal.findAll({ where: { sucursalId }, attributes: ['insumoId', 'cantidad'] }),
        ]);

        const recetasPorProducto = agruparPorProducto(recetas);
        const stockPorInsumo = stockComoMapa(stock);

        // Primero, cada producto por su propia receta
        const porReceta = new Map(productos.map((p) => [
            p.id,
            productoDisponible(p, recetasPorProducto.get(p.id), stockPorInsumo, factorDe(p)),
        ]));

        // Un combo, además, necesita al menos una opción disponible en cada lugar obligatorio
        res.json(productos.map((p) => {
            let disponible = porReceta.get(p.id);
            if (disponible && p.grupos?.length) {
                disponible = p.grupos
                    .filter((g) => g.obligatorio)
                    .every((g) => productos.some((o) => o.categoriaId === g.categoriaId && porReceta.get(o.id)));
            }
            return { ...p, disponible };
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
            include: [
                { model: RecetaInsumo, include: [Insumo] },
                incluirTamanios(),
                incluirGrupos()
            ]
        });

        if (!producto) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        const productoJson = producto.toJSON();
        const { RecetaInsumos, ...resto } = productoJson;
        const datosProducto = aplanarProducto(resto);
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
            disponible: productoDisponible(datosProducto, ingredientes, stockPorInsumo, factorDe(datosProducto)),
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