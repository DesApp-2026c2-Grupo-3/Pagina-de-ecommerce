const { Producto, ProductoTamanio } = require('../models');

// En un combo, la opción más barata de cada lugar va incluida; las demás pagan la diferencia.
// Se compara con todos los productos de la categoría que se venden en ese tamaño
// (aunque estén pausados o sin stock), así el recargo es el mismo en todas las sucursales.
async function precioMasBarato(categoriaId, tamanioId, transaction) {
    const productos = await Producto.findAll({
        where: { categoriaId },
        include: [{ model: ProductoTamanio, as: 'tamanios', where: { tamanioId }, required: true }],
        transaction,
    });

    const precios = productos.flatMap((p) => (p.tamanios ?? []).map((t) => Number(t.precio)));
    return precios.length > 0 ? Math.min(...precios) : null;
}

module.exports = { precioMasBarato };