// Todo lo de los tamaños es estándar: precio, consumo de stock y medida.
// Para cambiar algo, se cambia solo acá (los porcentajes también en admin/src/config/tamanios.ts).
const TAMANIOS = [
    { tamanioId: 1, factorPrecio: 1, factorStock: 1 },     // Regular
    { tamanioId: 2, factorPrecio: 1.2, factorStock: 1.5 }, // Mediano: +20%
    { tamanioId: 3, factorPrecio: 1.4, factorStock: 2 },   // Grande: +40%
];

// Medidas estándar por categoría (por su nombre, sin importar mayúsculas).
// Las categorías que no figuran acá no muestran medida.
const MEDIDAS_ESTANDAR = {
    bebidas: { 1: '354 ml', 2: '500 ml', 3: '750 ml' },
};

const redondearA100 = (n) => Math.round(n / 100) * 100;

function medidasDe(nombreCategoria) {
    return MEDIDAS_ESTANDAR[(nombreCategoria ?? '').trim().toLowerCase()] ?? {};
}

// Los tres tamaños de un producto, a partir del precio regular y su categoría
function tamaniosDesdePrecio(precioRegular, nombreCategoria) {
    const precio = Number(precioRegular);
    const medidas = medidasDe(nombreCategoria);
    return TAMANIOS.map((t) => ({
        tamanioId: t.tamanioId,
        precio: t.tamanioId === 1 ? precio : redondearA100(precio * t.factorPrecio),
        factorStock: t.factorStock,
        etiqueta: medidas[t.tamanioId] ?? null,
    }));
}

module.exports = { TAMANIOS, MEDIDAS_ESTANDAR, tamaniosDesdePrecio, medidasDe };