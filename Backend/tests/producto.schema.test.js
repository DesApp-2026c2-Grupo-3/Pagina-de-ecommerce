const { productoSchema } = require('../src/schemas/producto.schema');

const productoValido = {
    nombre: 'Hamburguesa clásica',
    descripcion: 'Carne, queso cheddar, lechuga y tomate',
    precio: 8500,
    imagen: '/imagenes/clasica.png',
    disponible: true,
    categoriaId: 1,
};

// Devuelve el mensaje de error, o undefined si los datos son válidos
function mensajeDe(datos) {
    return productoSchema.validate(datos).error?.details[0].message;
}

describe('productoSchema', () => {
    describe('casos válidos', () => {
        test('acepta un producto completo', () => {
            expect(mensajeDe(productoValido)).toBeUndefined();
        });

        test('acepta un producto sin imagen ni categoría', () => {
            const { imagen, categoriaId, ...minimo } = productoValido;
            expect(mensajeDe(minimo)).toBeUndefined();
        });

        test('si no viene "disponible", lo pone en true', () => {
            const { disponible, ...sinDisponible } = productoValido;
            const { value } = productoSchema.validate(sinDisponible);
            expect(value.disponible).toBe(true);
        });

        test('convierte el precio de texto a número', () => {
            const { value } = productoSchema.validate({ ...productoValido, precio: '8500' });
            expect(value.precio).toBe(8500);
        });

        test('redondea el precio a 2 decimales', () => {
            const { value } = productoSchema.validate({ ...productoValido, precio: 10.126 });
            expect(value.precio).toBe(10.13);
        });
    });

    describe('nombre', () => {
        test('es obligatorio', () => {
            const { nombre, ...sinNombre } = productoValido;
            expect(mensajeDe(sinNombre)).toBe('El nombre del producto es obligatorio');
        });

        test('no puede ser solo espacios', () => {
            expect(mensajeDe({ ...productoValido, nombre: '   ' })).toBe(
                'El nombre del producto es obligatorio'
            );
        });

        test('rechaza menos de 3 caracteres', () => {
            expect(mensajeDe({ ...productoValido, nombre: 'ab' })).toBe(
                'El nombre debe tener al menos 3 caracteres'
            );
        });

        test('acepta exactamente 50 caracteres', () => {
            expect(mensajeDe({ ...productoValido, nombre: 'a'.repeat(50) })).toBeUndefined();
        });

        test('rechaza más de 50 caracteres', () => {
            expect(mensajeDe({ ...productoValido, nombre: 'a'.repeat(51) })).toBe(
                'El nombre no puede superar los 50 caracteres'
            );
        });
    });

    describe('descripción', () => {
        test('es obligatoria', () => {
            const { descripcion, ...sinDescripcion } = productoValido;
            expect(mensajeDe(sinDescripcion)).toBe('La descripción es obligatoria');
        });

        test('acepta exactamente 300 caracteres', () => {
            expect(mensajeDe({ ...productoValido, descripcion: 'a'.repeat(300) })).toBeUndefined();
        });

        test('rechaza más de 300 caracteres', () => {
            expect(mensajeDe({ ...productoValido, descripcion: 'a'.repeat(301) })).toBe(
                'La descripción no puede superar los 300 caracteres'
            );
        });
    });

    describe('precio', () => {
        test('es obligatorio', () => {
            const { precio, ...sinPrecio } = productoValido;
            expect(mensajeDe(sinPrecio)).toBe('El precio es obligatorio');
        });

        test('rechaza un texto que no es número', () => {
            expect(mensajeDe({ ...productoValido, precio: 'caro' })).toBe(
                'El precio debe ser un número válido'
            );
        });

        test.each([0, -100])('rechaza el precio %s', (precio) => {
            expect(mensajeDe({ ...productoValido, precio })).toBe(
                'El precio debe ser un valor positivo'
            );
        });
    });

    describe('disponible', () => {
        test('rechaza un valor que no es verdadero ni falso', () => {
            expect(mensajeDe({ ...productoValido, disponible: 'tal vez' })).toBe(
                'El campo disponible debe ser verdadero o falso'
            );
        });
    });

    describe('categoría', () => {
        test('acepta categoría nula', () => {
            expect(mensajeDe({ ...productoValido, categoriaId: null })).toBeUndefined();
        });

        test('rechaza un id con decimales', () => {
            expect(mensajeDe({ ...productoValido, categoriaId: 2.5 })).toBe(
                'El ID de la categoría debe ser un número entero'
            );
        });

        test('rechaza un id negativo', () => {
            expect(mensajeDe({ ...productoValido, categoriaId: -1 })).toBe(
                'El ID de la categoría debe ser positivo'
            );
        });
    });
});