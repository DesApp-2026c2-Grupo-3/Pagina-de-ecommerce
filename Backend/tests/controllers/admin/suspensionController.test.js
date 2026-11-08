const mockModelos = {
    Producto: { findAll: jest.fn() },
    ProductoTamanio: {},
    RecetaInsumo: { findAll: jest.fn() },
    StockSucursal: { findAll: jest.fn() },
    SuspensionProducto: { findAll: jest.fn(), bulkCreate: jest.fn(), update: jest.fn(), count: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
    Admin: {},
    sequelize: { transaction: jest.fn() },
};
jest.mock('../../../src/models', () => mockModelos);

const { suspender, rehabilitar, productosDeSucursal, listar } = require('../../../src/controllers/admin/suspensionController');
const { Producto, RecetaInsumo, StockSucursal, SuspensionProducto, Sucursal, sequelize } = mockModelos;

const crearRes = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn() });
const master = { id: 1, rol: 'MASTER', sucursalId: null };
const encargado = { id: 7, rol: 'ADMIN', sucursalId: 2 };

describe('suspender', () => {
    let t;
    beforeEach(() => {
        jest.clearAllMocks();
        t = { commit: jest.fn(), rollback: jest.fn() };
        sequelize.transaction.mockResolvedValue(t);
        Sucursal.findByPk.mockResolvedValue({ id: 2 });
        // Existen todos los productos que se piden
        Producto.findAll.mockImplementation(async ({ where }) => where.id.map((id) => ({ id })));
        SuspensionProducto.findAll.mockResolvedValue([]);
    });

    it('el encargado suspende con motivo: una fila por producto, con su origen y quién la hizo', async () => {
        const res = crearRes();
        await suspender({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10, 11], motivo: 'Se rompió la máquina de café' } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(SuspensionProducto.bulkCreate).toHaveBeenCalledWith([
            { productoId: 10, sucursalId: 2, origen: 'ENCARGADO', motivo: 'Se rompió la máquina de café', creadaPorId: 7 },
            { productoId: 11, sucursalId: 2, origen: 'ENCARGADO', motivo: 'Se rompió la máquina de café', creadaPorId: 7 },
        ], { transaction: t });
    });

    it('el encargado no puede suspender sin motivo', async () => {
        const res = crearRes();
        await suspender({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10], motivo: '  ' } }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(SuspensionProducto.bulkCreate).not.toHaveBeenCalled();
    });

    it('los productos ya suspendidos se saltean', async () => {
        SuspensionProducto.findAll.mockResolvedValue([{ productoId: 10 }]);
        const res = crearRes();
        await suspender({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10, 11], motivo: 'Falla del horno' } }, res);
        expect(SuspensionProducto.bulkCreate.mock.calls[0][0].map((f) => f.productoId)).toEqual([11]);
        expect(res.json).toHaveBeenCalledWith({ suspendidos: 1, yaSuspendidos: 1 });
    });

    it('el master deshabilita en una sucursal con origen MASTER y un motivo por defecto', async () => {
        const res = crearRes();
        await suspender({ usuario: master, params: { id: '2' }, body: { productoIds: [10], motivo: '' } }, res);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(SuspensionProducto.bulkCreate.mock.calls[0][0][0]).toEqual(
            expect.objectContaining({ origen: 'MASTER', motivo: 'Deshabilitado por la administración', creadaPorId: 1 }),
        );
    });

    it('responde 404 si algún producto no existe', async () => {
        Producto.findAll.mockResolvedValue([{ id: 10 }]);
        const res = crearRes();
        await suspender({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10, 99], motivo: 'Falla del horno' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(t.rollback).toHaveBeenCalled();
    });
});

describe('rehabilitar: el encargado levanta lo suyo, el master levanta todo', () => {
    beforeEach(() => jest.clearAllMocks());

    it('el encargado levanta sus suspensiones y queda quién y cuándo', async () => {
        SuspensionProducto.findAll.mockResolvedValue([{ productoId: 10 }, { productoId: 11 }]);
        SuspensionProducto.update.mockResolvedValue([2]);
        const res = crearRes();
        await rehabilitar({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10, 11] } }, res);
        const donde = { sucursalId: 2, origen: 'ENCARGADO', rehabilitadaEn: null, productoId: [10, 11] };
        expect(SuspensionProducto.update).toHaveBeenCalledWith(
            expect.objectContaining({ rehabilitadaPorId: 7, rehabilitadaEn: expect.any(Date) }),
            { where: donde },
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ rehabilitados: 2, noRehabilitados: 0 });
    });

    it('el master levanta también la suspensión del encargado, y queda que fue él', async () => {
        SuspensionProducto.findAll.mockResolvedValue([{ productoId: 10 }]);
        SuspensionProducto.update.mockResolvedValue([1]);
        const res = crearRes();
        await rehabilitar({ usuario: master, params: { id: '2' }, body: { productoIds: [10] } }, res);
        // Sin filtro de origen: alcanza a las dos clases de suspensión
        expect(SuspensionProducto.update).toHaveBeenCalledWith(
            expect.objectContaining({ rehabilitadaPorId: 1, rehabilitadaEn: expect.any(Date) }),
            { where: { sucursalId: 2, rehabilitadaEn: null, productoId: [10] } },
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ rehabilitados: 1, noRehabilitados: 0 });
    });

    it('si un producto tiene la suspensión del encargado y la del master, el master lo cuenta una sola vez', async () => {
        SuspensionProducto.findAll.mockResolvedValue([{ productoId: 10 }, { productoId: 10 }]);
        SuspensionProducto.update.mockResolvedValue([2]);
        const res = crearRes();
        await rehabilitar({ usuario: master, params: { id: '2' }, body: { productoIds: [10] } }, res);
        expect(res.json).toHaveBeenCalledWith({ rehabilitados: 1, noRehabilitados: 0 });
    });

    it('informa cuántos de los pedidos no estaban suspendidos', async () => {
        SuspensionProducto.findAll.mockResolvedValue([{ productoId: 10 }]);
        SuspensionProducto.update.mockResolvedValue([1]);
        const res = crearRes();
        await rehabilitar({ usuario: master, params: { id: '2' }, body: { productoIds: [10, 11, 12] } }, res);
        expect(res.json).toHaveBeenCalledWith({ rehabilitados: 1, noRehabilitados: 2 });
    });

    it('el encargado NO puede levantar lo que deshabilitó el master (403)', async () => {
        SuspensionProducto.findAll.mockResolvedValue([]);
        SuspensionProducto.count.mockResolvedValue(1);
        const res = crearRes();
        await rehabilitar({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10] } }, res);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(SuspensionProducto.update).not.toHaveBeenCalled();
    });

    it('responde 404 si no había nada suspendido (encargado)', async () => {
        SuspensionProducto.findAll.mockResolvedValue([]);
        SuspensionProducto.count.mockResolvedValue(0);
        const res = crearRes();
        await rehabilitar({ usuario: encargado, params: { id: '2' }, body: { productoIds: [10] } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('responde 404 si no había nada suspendido (master)', async () => {
        SuspensionProducto.findAll.mockResolvedValue([]);
        const res = crearRes();
        await rehabilitar({ usuario: master, params: { id: '2' }, body: { productoIds: [10] } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(SuspensionProducto.count).not.toHaveBeenCalled();
        expect(SuspensionProducto.update).not.toHaveBeenCalled();
    });
});

describe('productosDeSucursal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Sucursal.findByPk.mockResolvedValue({ id: 2, nombre: 'Morón' });
        RecetaInsumo.findAll.mockResolvedValue([{ productoId: 3, insumoId: 1, cantidadBase: 5 }]);
        StockSucursal.findAll.mockResolvedValue([{ insumoId: 1, cantidad: '1' }]);
    });

    it('arma el estado de cada producto: deshabilitado > suspendido > sin stock > disponible', async () => {
        Producto.findAll.mockResolvedValue([
            { id: 1, nombre: 'Latte', categoriaId: 1, disponible: true, tamanios: [] },
            { id: 2, nombre: 'Doble', categoriaId: 2, disponible: true, tamanios: [] },
            { id: 3, nombre: 'Simple', categoriaId: 2, disponible: true, tamanios: [] },
            { id: 4, nombre: 'Papas', categoriaId: 3, disponible: false, tamanios: [] },
            { id: 5, nombre: 'Flan', categoriaId: 4, disponible: true, tamanios: [] },
        ]);
        SuspensionProducto.findAll.mockResolvedValue([
            { id: 1, productoId: 1, origen: 'ENCARGADO', motivo: 'Máquina rota', createdAt: new Date(), creadaPor: { id: 7, nombre: 'Valentina' } },
            { id: 2, productoId: 5, origen: 'MASTER', motivo: 'Deshabilitado por la administración', createdAt: new Date(), creadaPor: { id: 1, nombre: 'Dueño' } },
        ]);
        const res = crearRes();
        await productosDeSucursal({ usuario: master, params: { id: '2' } }, res);
        const lista = res.json.mock.calls[0][0];
        const estado = (id) => lista.find((p) => p.id === id).estado;
        expect(estado(1)).toBe('suspendido');
        expect(estado(2)).toBe('disponible');
        expect(estado(3)).toBe('sin-stock');
        expect(estado(4)).toBe('deshabilitado');
        expect(estado(5)).toBe('deshabilitado');
    });

    it('el encargado ve lo suspendido en su sucursal, pero no lo que deshabilitó la administración', async () => {
        Producto.findAll.mockResolvedValue([
            { id: 1, nombre: 'Latte', categoriaId: 1, disponible: true, tamanios: [] },
            { id: 2, nombre: 'Doble', categoriaId: 2, disponible: true, tamanios: [] },
            { id: 4, nombre: 'Papas', categoriaId: 3, disponible: false, tamanios: [] },
            { id: 5, nombre: 'Flan', categoriaId: 4, disponible: true, tamanios: [] },
        ]);
        SuspensionProducto.findAll.mockResolvedValue([
            // Suspendido por otro encargado de la misma sucursal
            { id: 1, productoId: 1, origen: 'ENCARGADO', motivo: 'Máquina rota', createdAt: new Date(), creadaPor: { id: 8, nombre: 'Nicolás' } },
            { id: 2, productoId: 5, origen: 'MASTER', motivo: 'Deshabilitado por la administración', createdAt: new Date(), creadaPor: { id: 1, nombre: 'Dueño' } },
        ]);
        const res = crearRes();
        await productosDeSucursal({ usuario: encargado, params: { id: '2' } }, res);
        const lista = res.json.mock.calls[0][0];
        // Papas (apagado en todas) y Flan (deshabilitado por el master) no aparecen
        expect(lista.map((p) => p.id)).toEqual([1, 2]);
        expect(lista.find((p) => p.id === 1).estado).toBe('suspendido');
        expect(lista.find((p) => p.id === 1).suspension.por.nombre).toBe('Nicolás');
        expect(lista.find((p) => p.id === 1).puedeRehabilitar).toBe(true);
    });

    it('el master puede levantar tanto la suspensión del encargado como la propia', async () => {
        Producto.findAll.mockResolvedValue([
            { id: 1, nombre: 'Latte', categoriaId: 1, disponible: true, tamanios: [] },
            { id: 2, nombre: 'Doble', categoriaId: 2, disponible: true, tamanios: [] },
            { id: 5, nombre: 'Flan', categoriaId: 4, disponible: true, tamanios: [] },
        ]);
        SuspensionProducto.findAll.mockResolvedValue([
            { id: 1, productoId: 1, origen: 'ENCARGADO', motivo: 'Máquina rota', createdAt: new Date(), creadaPor: { id: 7, nombre: 'Valentina' } },
            { id: 2, productoId: 5, origen: 'MASTER', motivo: 'Deshabilitado por la administración', createdAt: new Date(), creadaPor: { id: 1, nombre: 'Dueño' } },
        ]);
        const res = crearRes();
        await productosDeSucursal({ usuario: master, params: { id: '2' } }, res);
        const lista = res.json.mock.calls[0][0];
        expect(lista.find((p) => p.id === 1).puedeRehabilitar).toBe(true);
        expect(lista.find((p) => p.id === 5).puedeRehabilitar).toBe(true);
        // Lo que no está suspendido no tiene nada para levantar
        expect(lista.find((p) => p.id === 2).puedeRehabilitar).toBe(false);
    });
});

describe('listar (registro de suspensiones)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SuspensionProducto.findAll.mockResolvedValue([]);
    });

    it('el master ve las de todas las sucursales y de los dos orígenes', async () => {
        await listar({ usuario: master, query: {} }, crearRes());
        expect(SuspensionProducto.findAll.mock.calls[0][0].where).toEqual({ rehabilitadaEn: null });
    });

    it('el encargado ve solo las suyas, sin lo que deshabilitó la administración', async () => {
        await listar({ usuario: encargado, query: {} }, crearRes());
        expect(SuspensionProducto.findAll.mock.calls[0][0].where).toEqual({
            sucursalId: 2,
            origen: 'ENCARGADO',
            rehabilitadaEn: null,
        });
    });
});
