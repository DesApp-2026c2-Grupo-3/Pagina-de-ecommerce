const { Producto, RecetaInsumo, ComboGrupo, Insumo } = require('../models');

// Las columnas JSON pueden llegar como texto según la base
function comoJson(valor) {
    if (valor == null) return null;
    if (typeof valor !== 'string') return valor;
    try {
        return JSON.parse(valor);
    } catch {
        return null;
    }
}

const idValido = (valor) => {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
};

// Lo mínimo del catálogo que hace falta para leer un pedido, solo para los
// productos e insumos que aparecen en él (incluye eliminados: paranoid: false):
//   productos: [{ id, nombre, receta: [{ insumoId, cantidadBase }], grupos: [{ id, nombre }] }]
//   insumos:   [{ id, nombre }]
// La receta de un combo es la de su producto principal (igual que al crear el pedido),
// así "+1 Cheddar" se calcula contra la misma base que se usó para cobrarlo.
async function catalogoDelPedido(detalles = []) {
    const productoIds = new Set();
    const insumoIds = new Set();

    for (const detalle of detalles) {
        const productoId = idValido(detalle.productoId);
        if (productoId) productoIds.add(productoId);

        for (const eleccion of comoJson(detalle.combo)?.elecciones ?? []) {
            const id = idValido(eleccion?.productoId);
            if (id) productoIds.add(id);
        }
        for (const personalizacion of comoJson(detalle.personalizaciones) ?? []) {
            const id = idValido(personalizacion?.insumoId);
            if (id) insumoIds.add(id);
        }
    }

    if (productoIds.size === 0 && insumoIds.size === 0) {
        return { productos: [], insumos: [] };
    }

    const buscarProductos = (ids) =>
        Producto.findAll({
            where: { id: [...ids] },
            paranoid: false,
            attributes: ['id', 'nombre', 'productoPrincipalId'],
            include: [
                { model: RecetaInsumo, attributes: ['insumoId', 'cantidadBase'] },
                { model: ComboGrupo, as: 'grupos', attributes: ['id', 'nombre', 'orden'] },
            ],
        });

    const productos = productoIds.size > 0 ? await buscarProductos(productoIds) : [];
    const porId = new Map(productos.map((p) => [p.id, p]));

    // Principales de los combos que no estaban en el pedido (solo para su receta)
    const principalesFaltantes = new Set(
        productos
            .map((p) => p.productoPrincipalId)
            .filter((id) => id != null && !porId.has(id))
    );
    if (principalesFaltantes.size > 0) {
        for (const p of await buscarProductos(principalesFaltantes)) porId.set(p.id, p);
    }

    const insumos = insumoIds.size > 0
        ? await Insumo.findAll({
            where: { id: [...insumoIds] },
            paranoid: false,
            attributes: ['id', 'nombre'],
        })
        : [];

    const receta = (producto) =>
        (producto?.RecetaInsumos ?? []).map((r) => ({
            insumoId: r.insumoId,
            cantidadBase: Number(r.cantidadBase),
        }));

    return {
        productos: productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            receta: receta(p.productoPrincipalId ? porId.get(p.productoPrincipalId) : p),
            grupos: [...(p.grupos ?? [])]
                .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
                .map((g) => ({ id: g.id, nombre: g.nombre })),
        })),
        insumos: insumos.map((i) => ({ id: i.id, nombre: i.nombre })),
    };
}

module.exports = { catalogoDelPedido };
