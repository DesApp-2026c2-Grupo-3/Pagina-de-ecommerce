const { pedidoSchema } = require('../src/schemas/pedido.schema');

const pedidoValido = {
    usuarioId: 1,
    direccionId: 3,
    sucursalId: 2,
    productos: [
        {
            productoId: 10,
            cantidad: 2,
            // Sin el insumo 5 y con doble del insumo 8
            personalizaciones: [
                { insumoId: 5, cantidad: 0 },
                { insumoId: 8, cantidad: 2 },
            ],
        },
        { productoId: 15, cantidad: 1 },
    ],
};

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(datos) {
    return pedidoSchema.validate(datos).error?.details[0].message;
}

// Copia el pedido válido con un único producto
function conProducto(producto) {
    return { ...pedidoValido, productos: [producto] };
}

describe('pedidoSchema', () => {
    describe('casos válidos', () => {
        test('acepta un pedido con y sin personalizaciones', () => {
            expect(mensajeDe(pedidoValido)).toBeUndefined();
        });

        test('si un producto no trae personalizaciones, las pone como lista vacía', () => {
            const { value } = pedidoSchema.validate(pedidoValido);
            expect(value.productos[1].personalizaciones).toEqual([]);
        });

        test('acepta el mismo producto dos veces con distinta personalización', () => {
            const datos = {
                ...pedidoValido,
                productos: [
                    { productoId: 10, cantidad: 1 },
                    { productoId: 10, cantidad: 1, personalizaciones: [{ insumoId: 5, cantidad: 0 }] },
                ],
            };
            expect(mensajeDe(datos)).toBeUndefined();
        });

        test('convierte los ids y cantidades de texto a número', () => {
            const { value } = pedidoSchema.validate({
                usuarioId: '1',
                direccionId: '3',
                sucursalId: '2',
                productos: [{ productoId: '10', cantidad: '2' }],
            });
            expect(value.sucursalId).toBe(2);
            expect(value.productos[0]).toEqual({ productoId: 10, cantidad: 2, personalizaciones: [] });
        });
    });

    describe('usuario, dirección y sucursal', () => {
        test('exige el usuario', () => {
            const { usuarioId, ...sinUsuario } = pedidoValido;
            expect(mensajeDe(sinUsuario)).toBe('El id de usuario es obligatorio');
        });

        test('exige una dirección de entrega', () => {
            const { direccionId, ...sinDireccion } = pedidoValido;
            expect(mensajeDe(sinDireccion)).toBe('Tenés que seleccionar una dirección de entrega');
        });

        test('exige una sucursal', () => {
            const { sucursalId, ...sinSucursal } = pedidoValido;
            expect(mensajeDe(sinSucursal)).toBe('Tenés que seleccionar una sucursal');
        });

        test('rechaza una sucursal que no es número', () => {
            expect(mensajeDe({ ...pedidoValido, sucursalId: 'centro' })).toBe(
                'El id de sucursal debe ser un número'
            );
        });
    });

    describe('productos', () => {
        test('exige la lista de productos', () => {
            const { productos, ...sinProductos } = pedidoValido;
            expect(mensajeDe(sinProductos)).toBe('El pedido debe contener productos');
        });

        test('rechaza un pedido vacío', () => {
            expect(mensajeDe({ ...pedidoValido, productos: [] })).toBe(
                'El pedido debe contener al menos un producto'
            );
        });

        test('exige el id de cada producto', () => {
            expect(mensajeDe(conProducto({ cantidad: 1 }))).toBe('El id de producto es obligatorio');
        });

        test('exige la cantidad de cada producto', () => {
            expect(mensajeDe(conProducto({ productoId: 10 }))).toBe('La cantidad es obligatoria');
        });

        test.each([0, -1])('rechaza la cantidad %s', (cantidad) => {
            expect(mensajeDe(conProducto({ productoId: 10, cantidad }))).toBe(
                'La cantidad debe ser al menos 1'
            );
        });
    });

    describe('personalizaciones', () => {
        const personalizar = (personalizaciones) =>
            conProducto({ productoId: 10, cantidad: 1, personalizaciones });

        test('permite quitar un insumo (cantidad 0)', () => {
            expect(mensajeDe(personalizar([{ insumoId: 5, cantidad: 0 }]))).toBeUndefined();
        });

        test('permite cantidades con decimales (ej. 0.5 kg de papas)', () => {
            expect(mensajeDe(personalizar([{ insumoId: 7, cantidad: 0.5 }]))).toBeUndefined();
        });

        test('rechaza personalizaciones que no son una lista', () => {
            expect(mensajeDe(personalizar('sin cebolla'))).toBe('Las personalizaciones deben ser una lista');
        });

        test('exige el insumo', () => {
            expect(mensajeDe(personalizar([{ cantidad: 0 }]))).toBe(
                'Cada personalización debe indicar el insumo'
            );
        });

        test('exige la cantidad del insumo', () => {
            expect(mensajeDe(personalizar([{ insumoId: 5 }]))).toBe(
                'Cada personalización debe indicar la cantidad'
            );
        });

        test('rechaza una cantidad negativa', () => {
            expect(mensajeDe(personalizar([{ insumoId: 5, cantidad: -1 }]))).toBe(
                'La cantidad del insumo no puede ser negativa'
            );
        });
    });

    describe('seguridad: el cliente no decide el precio', () => {
        test('no acepta el precio de un producto', () => {
            const datos = conProducto({ productoId: 10, cantidad: 1, precio: 1 });
            expect(mensajeDe(datos)).toMatch(/not allowed/);
        });

        test('no acepta el precio unitario con extras', () => {
            const datos = conProducto({ productoId: 10, cantidad: 1, unitPrice: 1 });
            expect(mensajeDe(datos)).toMatch(/not allowed/);
        });

        test('no acepta el precio de un extra', () => {
            const datos = conProducto({
                productoId: 10,
                cantidad: 1,
                personalizaciones: [{ insumoId: 8, cantidad: 2, precioComercial: 0 }],
            });
            expect(mensajeDe(datos)).toMatch(/not allowed/);
        });

        test('no acepta el total del pedido', () => {
            expect(mensajeDe({ ...pedidoValido, total: 1 })).toMatch(/not allowed/);
        });
    });
});