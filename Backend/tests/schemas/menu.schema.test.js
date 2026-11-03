const { menuSchema } = require('../../src/schemas/admin/menu.schema');
const { validarMenu } = require('../../src/middleware/admin/validarMenu');

const mensajeDe = (datos) => menuSchema.validate(datos).error?.details[0].message;

const seccion = (extra = {}) => ({ slug: 'carne-de-res', nombre: 'Carne de Res', icono: 'hamburguesa', fondo: 'mostaza', categoriaId: 2, productoIds: [], ...extra });
const grupo = (extra = {}) => ({ slug: 'hamburguesas', nombre: 'Hamburguesas', porSecciones: false, categoriaIds: [2], secciones: [seccion()], ...extra });
const menu = (...grupos) => ({ grupos: grupos.length ? grupos : [grupo()] });

describe('menuSchema', () => {
    test('acepta un menú con un grupo con secciones', () => {
        expect(mensajeDe(menu())).toBeUndefined();
    });

    test('acepta los ids que trae el panel (grupos y secciones), sin usarlos', () => {
        const datos = menu(grupo({ id: 3, secciones: [seccion({ id: 12 })] }));
        expect(mensajeDe(datos)).toBeUndefined();
        expect(mensajeDe(menu(grupo({ id: 'abc' })))).toBeDefined();
    });

    test('completa los valores que faltan: activo, por defecto, productos a mano', () => {
        const { value } = menuSchema.validate({ grupos: [{ slug: 'bebidas', nombre: 'Bebidas' }] });
        expect(value.grupos[0]).toMatchObject({ activo: true, porSecciones: false, categoriaIds: [], secciones: [] });

        const { value: v2 } = menuSchema.validate(menu(grupo({ secciones: [{ slug: 'a', nombre: 'Sección' }] })));
        expect(v2.grupos[0].secciones[0]).toMatchObject({ activo: true, esPorDefecto: false, icono: null, fondo: null, categoriaId: null, productoIds: [] });
    });

    test('exige al menos un grupo', () => {
        expect(mensajeDe({ grupos: [] })).toBe('El menú tiene que tener al menos un grupo');
        expect(mensajeDe({})).toBe('Falta la lista de grupos del menú');
    });

    test.each(['Para Acompañar', 'para acompañar', '-x', 'x--y', ''])('rechaza el identificador "%s"', (slug) => {
        expect(mensajeDe(menu(grupo({ slug })))).toBeDefined();
    });

    test('valida los nombres', () => {
        expect(mensajeDe(menu(grupo({ nombre: 'A' })))).toBe('El nombre del grupo debe tener al menos 2 caracteres');
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ nombre: '' })] })))).toBe('El nombre de la sección no puede estar vacío');
        expect(mensajeDe(menu(grupo({ nombre: 'a'.repeat(41) })))).toBe('El nombre del grupo no puede superar los 40 caracteres');
    });

    test('valida el ícono y el color de la sección', () => {
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ icono: 'pizza' })] })))).toBe('El ícono elegido no es válido');
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ fondo: 'violeta' })] })))).toBe('El color elegido no es válido');
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ icono: 'aro', fondo: 'arena' })] })))).toBeUndefined();
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ icono: null, fondo: null })] })))).toBeUndefined();
    });

    test('no admite repetidos: grupos, secciones, productos ni categorías', () => {
        expect(mensajeDe(menu(grupo(), grupo()))).toBe('Dos grupos no pueden tener el mismo identificador');
        expect(mensajeDe(menu(grupo({ secciones: [seccion(), seccion()] }))))
            .toBe('Dos secciones de "Hamburguesas" no pueden tener el mismo identificador');
        expect(mensajeDe(menu(grupo({ secciones: [seccion({ productoIds: [1, 1] })] })))).toBe('Un producto no puede repetirse en la misma sección');
        expect(mensajeDe(menu(grupo({ categoriaIds: [2, 2] })))).toBe('Una categoría no puede repetirse en el mismo grupo');
    });

    test('un producto sí puede estar en secciones distintas (Brownie en Dulces y en Tortas)', () => {
        const datos = menu(grupo({ secciones: [seccion({ slug: 'a', productoIds: [7] }), seccion({ slug: 'b', productoIds: [7] })] }));
        expect(mensajeDe(datos)).toBeUndefined();
    });

    test('un grupo "por secciones" necesita al menos una', () => {
        expect(mensajeDe(menu(grupo({ porSecciones: true, secciones: [] })))).toBe('"Hamburguesas" se muestra por secciones pero no tiene ninguna');
    });

    test('limita la cantidad de secciones', () => {
        const trece = Array.from({ length: 13 }, (_, i) => seccion({ slug: `s-${i}` }));
        expect(mensajeDe(menu(grupo({ secciones: trece })))).toBe('Un grupo no puede tener más de 12 secciones');
    });
});

describe('validarMenu', () => {
    function crearRes() {
        const res = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    }

    test('deja pasar un menú válido con los datos completos', () => {
        const req = { body: menu() };
        const next = jest.fn();
        validarMenu(req, crearRes(), next);
        expect(next).toHaveBeenCalled();
        expect(req.body.grupos[0].activo).toBe(true);
    });

    test('responde 400 con el primer error', () => {
        const res = crearRes();
        const next = jest.fn();
        validarMenu({ body: { grupos: [] } }, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'El menú tiene que tener al menos un grupo' });
        expect(next).not.toHaveBeenCalled();
    });
});
