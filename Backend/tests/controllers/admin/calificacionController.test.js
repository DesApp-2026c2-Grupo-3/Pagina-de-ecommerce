jest.mock('../../../src/models', () => ({
    Admin: { findByPk: jest.fn() },
    sequelize: { query: jest.fn() },
}));

const { Admin, sequelize } = require('../../../src/models');
const { obtenerResumen, obtenerCalificaciones, obtenerFiltros } = require('../../../src/controllers/admin/calificacionController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

const MASTER = { id: 1, sucursalId: null };
const DE_SUCURSAL = { id: 2, sucursalId: 5 };
const pedir = (query = {}) => ({ usuario: { id: 1 }, query });

beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    Admin.findByPk.mockResolvedValue(MASTER);
});

// Las consultas del resumen se hacen en orden: general, por sucursal, por producto, por semana
function resumenConsultas({ porSucursal = [], porProducto = [], porSemana = [] } = {}) {
    sequelize.query
        .mockResolvedValueOnce([{ total: 10, promedio: '3.60', p1: 1, p2: 2, p3: 1, p4: 3, p5: 3, conComentario: 4 }])
        .mockResolvedValueOnce(porSucursal)
        .mockResolvedValueOnce(porProducto)
        .mockResolvedValueOnce(porSemana);
}

describe('obtenerResumen', () => {
    test('arma el promedio, la distribución y los desgloses', async () => {
        resumenConsultas({
            porSucursal: [{ id: 5, nombre: 'Hurlingham', total: 6, promedio: '4.00' }],
            porProducto: [{ id: 3, nombre: 'Fast Classic', total: 7, promedio: '3.80' }],
            porSemana: [{ semana: '2026-10-26', total: 4, promedio: '3.00' }, { semana: '2026-10-19', total: 6, promedio: '4.00' }],
        });
        const res = crearRes();

        await obtenerResumen(pedir(), res);

        const r = res.json.mock.calls[0][0];
        expect(r.total).toBe(10);
        expect(r.promedio).toBe(3.6);
        expect(r.conComentario).toBe(4);
        expect(r.distribucion).toEqual({ 1: 1, 2: 2, 3: 1, 4: 3, 5: 3 });
        expect(r.porSucursal).toEqual([{ id: 5, nombre: 'Hurlingham', total: 6, promedio: 4 }]);
        expect(r.porProducto[0]).toMatchObject({ nombre: 'Fast Classic', promedio: 3.8 });
        // De la más vieja a la más nueva
        expect(r.porSemana.map((s) => s.semana)).toEqual(['2026-10-19', '2026-10-26']);
    });

    test('sin calificaciones el promedio es null', async () => {
        sequelize.query
            .mockResolvedValueOnce([{ total: 0, promedio: null, p1: 0, p2: 0, p3: 0, p4: 0, p5: 0, conComentario: 0 }])
            .mockResolvedValue([]);
        const res = crearRes();

        await obtenerResumen(pedir(), res);

        expect(res.json.mock.calls[0][0]).toMatchObject({ total: 0, promedio: null, porSucursal: [], porProducto: [] });
    });

    test('el master puede filtrar por sucursal, producto, puntaje, comentario y fechas', async () => {
        resumenConsultas();
        await obtenerResumen(pedir({
            sucursalId: '5', productoId: '3', puntaje: '4', conComentario: 'true', desde: '2026-10-01', hasta: '2026-10-31',
        }), crearRes());

        const [sql, opciones] = sequelize.query.mock.calls[0];
        expect(sql).toMatch(/c\."sucursalId" = :sucursalId/);
        expect(sql).toMatch(/EXISTS \(SELECT 1 FROM "DetallePedidos"/);
        expect(sql).toMatch(/c\.puntaje = :puntaje/);
        expect(sql).toMatch(/c\.comentario IS NOT NULL/);
        expect(opciones.replacements).toMatchObject({ sucursalId: 5, productoId: 3, puntaje: 4 });
        expect(opciones.replacements.desde).toEqual(new Date('2026-10-01T03:00:00Z'));
        // "hasta" incluye todo el día 31
        expect(opciones.replacements.hasta).toEqual(new Date('2026-11-01T03:00:00Z'));
    });

    test('con una sucursal elegida no compara sucursales, y con un producto elegido no arma el ranking de productos', async () => {
        sequelize.query
            .mockResolvedValueOnce([{ total: 1, promedio: '5.00', p1: 0, p2: 0, p3: 0, p4: 0, p5: 1, conComentario: 0 }])
            .mockResolvedValue([]);

        await obtenerResumen(pedir({ sucursalId: '5', productoId: '3' }), crearRes());

        // general + semanas: solo 2 consultas
        expect(sequelize.query).toHaveBeenCalledTimes(2);
    });

    test('el admin de sucursal solo ve la suya, aunque pida otra', async () => {
        Admin.findByPk.mockResolvedValue(DE_SUCURSAL);
        resumenConsultas();

        await obtenerResumen(pedir({ sucursalId: '9' }), crearRes());

        expect(sequelize.query.mock.calls[0][1].replacements.sucursalId).toBe(5);
        // No compara sucursales: general + producto + semana
        expect(sequelize.query).toHaveBeenCalledTimes(3);
    });

    test.each([
        [{ sucursalId: 'abc' }, 'La sucursal no es válida'],
        [{ productoId: '0' }, 'El producto no es válido'],
        [{ puntaje: '7' }, 'El puntaje debe ser de 1 a 5'],
        [{ desde: '31/10/2026' }, 'La fecha desde no es válida'],
        [{ hasta: 'ayer' }, 'La fecha hasta no es válida'],
        [{ desde: '2026-10-31', hasta: '2026-10-01' }, 'La fecha desde no puede ser posterior a la fecha hasta'],
    ])('filtros inválidos %j responden 400', async (query, mensaje) => {
        const res = crearRes();

        await obtenerResumen(pedir(query), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje });
        expect(sequelize.query).not.toHaveBeenCalled();
    });

    test('responde 401 si el admin ya no existe', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();
        await obtenerResumen(pedir(), res);
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('responde 500 si falla la base de datos', async () => {
        sequelize.query.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await obtenerResumen(pedir(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerCalificaciones', () => {
    const fila = {
        id: 1, puntaje: 4, comentario: 'Rico', fecha: new Date('2026-10-30T20:00:00Z'), pedidoId: 12, sucursalId: 5,
        sucursalNombre: 'Hurlingham', clienteNombre: 'Ana', clienteApellido: 'Pérez',
        pedidoTotal: '5400', pedidoFecha: new Date('2026-10-30T18:00:00Z'), productos: ['Fast Classic', 'Sprite'],
    };

    test('devuelve los datos crudos con el cliente, el pedido y la sucursal', async () => {
        sequelize.query.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([fila]);
        const res = crearRes();

        await obtenerCalificaciones(pedir(), res);

        expect(res.json.mock.calls[0][0]).toEqual({
            total: 1,
            pagina: 1,
            limite: 10,
            calificaciones: [{
                id: 1,
                puntaje: 4,
                comentario: 'Rico',
                fecha: fila.fecha,
                cliente: { nombre: 'Ana', apellido: 'Pérez' },
                pedido: { id: 12, total: 5400, fecha: fila.pedidoFecha },
                sucursal: { id: 5, nombre: 'Hurlingham' },
                productos: ['Fast Classic', 'Sprite'],
            }],
        });
    });

    test('pagina y limita el tamaño de página', async () => {
        sequelize.query.mockResolvedValueOnce([{ total: 300 }]).mockResolvedValueOnce([]);

        await obtenerCalificaciones(pedir({ pagina: '3', limite: '500' }), crearRes());

        const { replacements } = sequelize.query.mock.calls[1][1];
        expect(replacements).toMatchObject({ limite: 50, offset: 100 });
    });

    test('el admin de sucursal solo ve las de su sucursal', async () => {
        Admin.findByPk.mockResolvedValue(DE_SUCURSAL);
        sequelize.query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

        await obtenerCalificaciones(pedir({ sucursalId: '9' }), crearRes());

        expect(sequelize.query.mock.calls[0][1].replacements.sucursalId).toBe(5);
        expect(sequelize.query.mock.calls[1][1].replacements.sucursalId).toBe(5);
    });

    test('filtra por producto sin duplicar calificaciones', async () => {
        sequelize.query.mockResolvedValueOnce([{ total: 0 }]).mockResolvedValueOnce([]);

        await obtenerCalificaciones(pedir({ productoId: '3' }), crearRes());

        // Se filtra con EXISTS (no con un JOIN), así un pedido con el producto en dos líneas aparece una vez
        expect(sequelize.query.mock.calls[1][0]).toMatch(/EXISTS \(SELECT 1 FROM "DetallePedidos" dp/);
    });

    test('un filtro inválido responde 400', async () => {
        const res = crearRes();
        await obtenerCalificaciones(pedir({ puntaje: '9' }), res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('responde 500 si falla la base de datos', async () => {
        sequelize.query.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();
        await obtenerCalificaciones(pedir(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('obtenerFiltros', () => {
    test('el master elige entre todas las sucursales y los productos calificados', async () => {
        sequelize.query
            .mockResolvedValueOnce([{ id: 1, nombre: 'Centro' }])
            .mockResolvedValueOnce([{ id: 3, nombre: 'Fast Classic' }]);
        const res = crearRes();

        await obtenerFiltros(pedir(), res);

        expect(res.json).toHaveBeenCalledWith({
            sucursales: [{ id: 1, nombre: 'Centro' }],
            productos: [{ id: 3, nombre: 'Fast Classic' }],
        });
    });

    test('el admin de sucursal no elige sucursal y ve solo los productos de la suya', async () => {
        Admin.findByPk.mockResolvedValue(DE_SUCURSAL);
        sequelize.query.mockResolvedValueOnce([{ id: 3, nombre: 'Fast Classic' }]);
        const res = crearRes();

        await obtenerFiltros(pedir(), res);

        expect(sequelize.query).toHaveBeenCalledTimes(1);
        expect(sequelize.query.mock.calls[0][0]).toMatch(/WHERE c\."sucursalId" = :sucursalId/);
        expect(sequelize.query.mock.calls[0][1].replacements).toEqual({ sucursalId: 5 });
        expect(res.json).toHaveBeenCalledWith({ sucursales: [], productos: [{ id: 3, nombre: 'Fast Classic' }] });
    });

    test('responde 401 si el admin ya no existe y 500 si falla la base', async () => {
        Admin.findByPk.mockResolvedValue(null);
        const res = crearRes();
        await obtenerFiltros(pedir(), res);
        expect(res.status).toHaveBeenCalledWith(401);

        Admin.findByPk.mockResolvedValue(MASTER);
        sequelize.query.mockRejectedValue(new Error('Base caída'));
        const res2 = crearRes();
        await obtenerFiltros(pedir(), res2);
        expect(res2.status).toHaveBeenCalledWith(500);
    });
});
