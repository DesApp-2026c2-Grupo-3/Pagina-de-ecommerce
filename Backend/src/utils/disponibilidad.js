// Agrupa las filas de receta por producto: Map productoId -> [insumos]
function agruparPorProducto(recetas) {
    const mapa = new Map();
    for (const item of recetas) {
        const lista = mapa.get(item.productoId) ?? [];
        lista.push(item);
        mapa.set(item.productoId, lista);
    }
    return mapa;
}

// El stock de una sucursal como Map insumoId -> cantidad (Postgres la devuelve como texto)
function stockComoMapa(stock) {
    return new Map(stock.map((s) => [s.insumoId, Number(s.cantidad)]));
}

// Un producto está disponible si:
// 1. está activo (el "disponible" que maneja el admin), y
// 2. la sucursal tiene stock de TODOS los insumos de su receta para preparar una unidad.
// Un producto sin receta depende solo de la condición 1.
function productoDisponible(producto, receta = [], stockPorInsumo = new Map()) {
    if (!producto.disponible) return false;

    return receta.every((item) => {
        const necesario = Number(item.cantidadBase);
        if (necesario <= 0) return true;
        return (stockPorInsumo.get(item.insumoId) ?? 0) >= necesario;
    });
}

module.exports = { agruparPorProducto, stockComoMapa, productoDisponible };