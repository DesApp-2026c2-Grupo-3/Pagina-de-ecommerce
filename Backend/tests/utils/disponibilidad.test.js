const {
    agruparPorProducto,
    stockComoMapa,
    productoDisponible,
    factorMinimo,
    pasoExtra,
} = require('../../src/utils/disponibilidad');

describe('agruparPorProducto', () => {
    test('agrupa los insumos de cada producto', () => {
        const recetas = [
            { productoId: 1, insumoId: 10 },
            { productoId: 2, insumoId: 20 },
            { productoId: 1, insumoId: 11 },
        ];

        const mapa = agruparPorProducto(recetas);

        expect(mapa.get(1)).toEqual([
            { productoId: 1, insumoId: 10 },
            { productoId: 1, insumoId: 11 },
        ]);
        expect(mapa.get(2)).toEqual([{ productoId: 2, insumoId: 20 }]);
    });

    test('devuelve un mapa vacío sin recetas', () => {
        expect(agruparPorProducto([]).size).toBe(0);
    });
});

describe('stockComoMapa', () => {
    test('convierte las cantidades de texto a número', () => {
        const mapa = stockComoMapa([
            { insumoId: 10, cantidad: '8' },
            { insumoId: 20, cantidad: '0.5' },
        ]);

        expect(mapa.get(10)).toBe(8);
        expect(mapa.get(20)).toBe(0.5);
    });

    test('si hay insumos repetidos, queda el último valor', () => {
        const mapa = stockComoMapa([
            { insumoId: 10, cantidad: '8' },
            { insumoId: 10, cantidad: '3' },
        ]);

        expect(mapa.get(10)).toBe(3);
    });

    test('devuelve un mapa vacío sin stock', () => {
        expect(stockComoMapa([]).size).toBe(0);
    });
});

describe('pasoExtra', () => {
    test('los insumos que se cuentan por unidad suman de a 1', () => {
        expect(pasoExtra(1)).toBe(1);
        expect(pasoExtra(5)).toBe(1);
    });

    test('los insumos fraccionados suman su porción base', () => {
        expect(pasoExtra(0.5)).toBe(0.5);
        expect(pasoExtra(0.25)).toBe(0.25);
    });
});

describe('productoDisponible', () => {
    test('un producto pausado por el admin nunca está disponible', () => {
        expect(productoDisponible({ disponible: false }, [{ insumoId: 1, cantidadBase: '1' }])).toBe(false);
    });

    test('un producto sin receta depende solo de estar activo', () => {
        expect(productoDisponible({ disponible: true })).toBe(true);
    });

    test('con stock justo para una unidad está disponible', () => {
        const receta = [{ insumoId: 10, cantidadBase: '2' }];
        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 2]]))).toBe(true);
    });

    test('con stock insuficiente no está disponible', () => {
        const receta = [{ insumoId: 10, cantidadBase: '2' }];
        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 1.9]]))).toBe(false);
    });

    test('si falta un insumo de la receta no está disponible', () => {
        const receta = [
            { insumoId: 10, cantidadBase: '1' },
            { insumoId: 20, cantidadBase: '1' },
        ];
        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 5]]))).toBe(false);
    });

    test('los insumos con cantidad 0 o negativa no bloquean', () => {
        const receta = [
            { insumoId: 10, cantidadBase: '0' },
            { insumoId: 20, cantidadBase: '-1' },
        ];
        expect(productoDisponible({ disponible: true }, receta, new Map())).toBe(true);
    });

    test('el factor del tamaño multiplica el stock necesario', () => {
        const receta = [{ insumoId: 10, cantidadBase: '1' }];

        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 2]]), 2)).toBe(true);
        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 1.9]]), 2)).toBe(false);
    });

    test('por defecto el factor es 1', () => {
        const receta = [{ insumoId: 10, cantidadBase: '1' }];
        expect(productoDisponible({ disponible: true }, receta, new Map([[10, 1]]))).toBe(true);
    });
});

describe('factorMinimo', () => {
    test('sin tamaños, el factor es 1', () => {
        expect(factorMinimo([])).toBe(1);
        expect(factorMinimo()).toBe(1);
    });

    test('devuelve el menor factor de los tamaños', () => {
        expect(factorMinimo([{ factorStock: 2 }, { factorStock: 1.5 }, { factorStock: 3 }])).toBe(1.5);
    });

    test('convierte los factores de texto a número', () => {
        expect(factorMinimo([{ factorStock: '2' }, { factorStock: '0.5' }])).toBe(0.5);
    });

    test('un factor ausente o nulo cuenta como 1', () => {
        expect(factorMinimo([{}, { factorStock: null }])).toBe(1);
    });
});
