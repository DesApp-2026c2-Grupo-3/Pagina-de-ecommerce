const { productoDisponible } = require('../../src/utils/disponibilidad');

describe('productoDisponible con suspensiones', () => {
    const producto = { id: 5, disponible: true };
    const receta = [{ insumoId: 1, cantidadBase: 2 }];
    const stock = new Map([[1, 10]]);

    it('un producto suspendido en la sucursal no está disponible aunque haya stock', () => {
        expect(productoDisponible(producto, receta, stock, 1, new Set([5]))).toBe(false);
    });

    it('la suspensión de otro producto no lo afecta', () => {
        expect(productoDisponible(producto, receta, stock, 1, new Set([9]))).toBe(true);
    });

    it('sin suspensiones se comporta como siempre', () => {
        expect(productoDisponible(producto, receta, stock)).toBe(true);
        expect(productoDisponible(producto, receta, new Map([[1, 1]]))).toBe(false);
    });
});
