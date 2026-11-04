const { promocionSchema } = require('../../src/schemas/admin/promocion.schema');

const mensajeDe = (datos) => promocionSchema.validate(datos).error?.details[0].message;

const dia = (extra = {}) => ({
    tipo: 'DIA',
    titulo: 'Lunes clásico',
    destacado: '25%',
    detalle: 'El Combo Fast Classic con 25 % menos.',
    dias: [1],
    items: [{ productoId: 4, cantidad: 1, descuento: 0.25 }],
    ...extra,
});

const semana = (extra = {}) => ({
    tipo: 'SEMANA',
    titulo: 'Combo Habemus Bacon',
    destacado: '20%',
    detalle: 'El más pedido de la casa, con 20 % menos.',
    items: [{ productoId: 4, cantidad: 1, descuento: 0.2 }],
    ...extra,
});

const regalo = (extra = {}) => ({
    tipo: 'REGALO',
    titulo: 'Papas con cheddar gratis',
    destacado: 'Gratis',
    detalle: 'Con compras desde $15.000 sumá unas papas sin cargo.',
    maxPorPedido: 1,
    compraMinima: 15000,
    items: [{ productoId: 7, cantidad: 1, descuento: 1 }],
    ...extra,
});

describe('promocionSchema: promos válidas', () => {
    test('acepta una promo del día, una de la semana y un regalo', () => {
        expect(mensajeDe(dia())).toBeUndefined();
        expect(mensajeDe(semana())).toBeUndefined();
        expect(mensajeDe(regalo())).toBeUndefined();
    });

    test('acepta una promo con un producto a precio de lista y otro con descuento', () => {
        const datos = dia({ items: [
            { productoId: 3, cantidad: 1, descuento: 0 },
            { productoId: 8, cantidad: 1, descuento: 0.5 },
        ] });
        expect(mensajeDe(datos)).toBeUndefined();
    });

    test('nace activa por defecto y quita los espacios de más', () => {
        const { value } = promocionSchema.validate(dia({ titulo: '  Lunes clásico  ' }));
        expect(value.activo).toBe(true);
        expect(value.titulo).toBe('Lunes clásico');
    });

    test('acepta varios días y límites opcionales en las promos del día', () => {
        expect(mensajeDe(dia({ dias: [1, 3, 6], maxPorPedido: 2, compraMinima: 5000 }))).toBeUndefined();
    });

    test('redondea el descuento a 3 decimales', () => {
        const { value } = promocionSchema.validate(dia({ items: [{ productoId: 4, cantidad: 1, descuento: 0.33333 }] }));
        expect(value.items[0].descuento).toBe(0.333);
    });
});

describe('promocionSchema: datos generales', () => {
    test('exige un tipo válido', () => {
        expect(mensajeDe(dia({ tipo: 'OFERTA' }))).toBe('El tipo de promoción debe ser SEMANA, REGALO o DIA');
        expect(mensajeDe(dia({ tipo: undefined }))).toBe('El tipo de promoción es obligatorio');
    });

    test('valida el título', () => {
        expect(mensajeDe(dia({ titulo: 'Ab' }))).toBe('El título debe tener al menos 3 caracteres');
        expect(mensajeDe(dia({ titulo: 'a'.repeat(61) }))).toBe('El título no puede superar los 60 caracteres');
        expect(mensajeDe(dia({ titulo: undefined }))).toBe('El título es obligatorio');
    });

    test('valida lo destacado (el círculo)', () => {
        expect(mensajeDe(dia({ destacado: 'a'.repeat(11) }))).toBe('Lo destacado no puede superar los 10 caracteres');
        expect(mensajeDe(dia({ destacado: undefined }))).toBe('Lo destacado (lo que va en el círculo) es obligatorio');
    });

    test('valida el detalle', () => {
        expect(mensajeDe(dia({ detalle: 'Hola' }))).toBe('El detalle debe tener al menos 5 caracteres');
        expect(mensajeDe(dia({ detalle: 'a'.repeat(201) }))).toBe('El detalle no puede superar los 200 caracteres');
    });

    test('valida los límites', () => {
        expect(mensajeDe(dia({ maxPorPedido: 0 }))).toBe('El máximo por pedido debe ser al menos 1');
        expect(mensajeDe(dia({ maxPorPedido: 11 }))).toBe('El máximo por pedido no puede superar 10');
        expect(mensajeDe(dia({ compraMinima: -1 }))).toBe('La compra mínima no puede ser negativa');
        expect(mensajeDe(dia({ compraMinima: 2000000 }))).toBe('La compra mínima no puede superar $1.000.000');
    });
});

describe('promocionSchema: productos', () => {
    test('exige al menos un producto y no más de 8', () => {
        expect(mensajeDe(dia({ items: [] }))).toBe('La promo tiene que incluir al menos un producto');
        expect(mensajeDe(dia({ items: undefined }))).toBe('La promo tiene que incluir al menos un producto');
        const nueve = Array.from({ length: 9 }, (_, i) => ({ productoId: i + 1, cantidad: 1, descuento: 0.1 }));
        expect(mensajeDe(dia({ items: nueve }))).toBe('Una promo no puede incluir más de 8 productos');
    });

    test('valida cada producto', () => {
        const con = (cambios) => dia({ items: [{ productoId: 4, cantidad: 1, descuento: 0.25, ...cambios }] });
        expect(mensajeDe(con({ productoId: undefined }))).toBe('Elegí un producto en cada fila de la promo');
        expect(mensajeDe(con({ cantidad: 0 }))).toBe('La cantidad de cada producto debe ser al menos 1');
        expect(mensajeDe(con({ cantidad: 21 }))).toBe('La cantidad de cada producto no puede superar 20');
        expect(mensajeDe(con({ descuento: 1.5 }))).toBe('El descuento no puede superar el 100 %');
        expect(mensajeDe(con({ descuento: -0.1 }))).toBe('El descuento no puede ser negativo');
    });

    test('un producto no puede repetirse', () => {
        const datos = dia({ items: [
            { productoId: 4, cantidad: 1, descuento: 0.2 },
            { productoId: 4, cantidad: 1, descuento: 0.3 },
        ] });
        expect(mensajeDe(datos)).toMatch(/no puede repetirse/);
    });

    test('al menos un producto tiene que tener descuento', () => {
        const datos = dia({ items: [{ productoId: 4, cantidad: 1, descuento: 0 }] });
        expect(mensajeDe(datos)).toBe('Al menos un producto de la promo tiene que tener descuento');
    });
});

describe('promocionSchema: reglas de cada tipo', () => {
    test('las promos del día necesitan al menos un día, del 0 al 6', () => {
        expect(mensajeDe(dia({ dias: undefined }))).toBe('Elegí al menos un día para la promo');
        expect(mensajeDe(dia({ dias: [] }))).toBe('Elegí al menos un día para la promo');
        expect(mensajeDe(dia({ dias: [7] }))).toBe('Los días van del 0 (domingo) al 6 (sábado)');
        expect(mensajeDe(dia({ dias: [1, 1] }))).toBe('Un día no puede repetirse');
    });

    test('el producto y el regalo de la semana no se eligen por día', () => {
        expect(mensajeDe(semana({ dias: [1] }))).toMatch(/Solo las promos del día se eligen por día/);
        expect(mensajeDe(regalo({ dias: [1] }))).toMatch(/Solo las promos del día se eligen por día/);
    });

    test('el producto de la semana es un solo producto, de a una unidad, sin límites', () => {
        const dos = semana({ items: [
            { productoId: 4, cantidad: 1, descuento: 0.2 },
            { productoId: 5, cantidad: 1, descuento: 0.2 },
        ] });
        expect(mensajeDe(dos)).toMatch(/un solo producto/);
        expect(mensajeDe(semana({ items: [{ productoId: 4, cantidad: 2, descuento: 0.2 }] }))).toMatch(/un solo producto/);
        expect(mensajeDe(semana({ maxPorPedido: 1 }))).toMatch(/no lleva máximo por pedido ni compra mínima/);
        expect(mensajeDe(semana({ compraMinima: 1000 }))).toMatch(/no lleva máximo por pedido ni compra mínima/);
    });

    test('el regalo de la semana va sin cargo', () => {
        const datos = regalo({ items: [{ productoId: 7, cantidad: 1, descuento: 0.5 }] });
        expect(mensajeDe(datos)).toMatch(/sin cargo/);
    });
});
