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

// Cuánto suma un extra: 1 unidad, o la porción base si no es entera (igual que el front)
function pasoExtra(cantidadBase) {
    return Number.isInteger(cantidadBase) ? 1 : cantidadBase;
}

// Un producto está disponible si:
// 1. está activo (el "disponible" que maneja el admin), y
// 2. la sucursal tiene stock de TODOS los insumos de su receta para preparar una unidad.
// Un producto sin receta depende solo de la condición 1.
// Un producto está disponible si:
// 1. está activo (el "disponible" que maneja el admin), y
// 2. la sucursal tiene stock de TODOS los insumos de su receta para preparar una unidad,
//    multiplicados por el factor de stock del tamaño.
function productoDisponible(producto, receta = [], stockPorInsumo = new Map(), factor = 1) {
    if (!producto.disponible) return false;

    return receta.every((item) => {
        const necesario = Number(item.cantidadBase) * factor;
        if (necesario <= 0) return true;
        return (stockPorInsumo.get(item.insumoId) ?? 0) >= necesario;
    });
}

// El factor del tamaño más chico: si alcanza para ese, el producto se puede vender
function factorMinimo(tamanios = []) {
    if (tamanios.length === 0) return 1;
    return Math.min(...tamanios.map((t) => Number(t.factorStock ?? 1)));
}

module.exports = { agruparPorProducto, stockComoMapa, productoDisponible, factorMinimo, pasoExtra };