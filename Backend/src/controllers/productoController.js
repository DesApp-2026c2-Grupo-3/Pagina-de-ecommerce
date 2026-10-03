const { Producto, RecetaInsumo, Insumo, ProductoTamanio, Tamanio, ComboGrupo } = require('../models');

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

// Los tamaños de un producto, ordenados (regular, mediano, grande) y con el nombre del tamaño:
// [{ tamanioId: 1, tamanio: 'regular', precio: '2100.00', etiqueta: null }]
function mapTamanios(tamanios) {
    return tamanios
        .map((pt) => ({
            tamanioId: pt.tamanioId,
            tamanio: pt.Tamanio ? pt.Tamanio.nombre : null,
            orden: pt.Tamanio ? pt.Tamanio.orden : 0,
            precio: pt.precio,
            etiqueta: pt.etiqueta
        }))
        .sort((a, b) => a.orden - b.orden)
        .map(({ orden, ...resto }) => resto);
}

function incluirTamanios() {
    return {
        model: ProductoTamanio,
        as: 'tamanios',
        attributes: ['tamanioId', 'precio', 'etiqueta'],
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

const obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll({
            include: [incluirTamanios()],
            order: [['id', 'ASC']]
        });
        res.json(productos.map(aplanarProducto));
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
            include: [
                { model: RecetaInsumo, include: [Insumo] },
                incluirTamanios(),
                incluirGrupos()
            ]
        });

        if (!producto) {
            return res.status(404).json({
                mensaje: 'Producto no encontrado'
            });
        }

        const productoJson = producto.toJSON();
        const { RecetaInsumos, ...datosProducto } = productoJson;

        res.json({
            ...aplanarProducto(datosProducto),
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
