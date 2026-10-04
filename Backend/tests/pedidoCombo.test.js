// Tamaños y combos en crearPedido: el precio y el stock los calcula el backend.
jest.mock('../src/models', () => {
    const t = { commit: jest.fn(), rollback: jest.fn(), LOCK: { UPDATE: 'UPDATE' } };
    return {
        Pedido: { create: jest.fn() },
        DetallePedido: { create: jest.fn() },
        Producto: { findByPk: jest.fn() },
        Usuario: { findByPk: jest.fn() },
        Direccion: { findOne: jest.fn() },
        Sucursal: { findByPk: jest.fn() },
        RecetaInsumo: { findAll: jest.fn() },
        ComboGrupo: { findAll: jest.fn() },
        Insumo: {},
        ProductoTamanio: {},
        StockSucursal: { findOne: jest.fn() },
        sequelize: { transaction: jest.fn().mockResolvedValue(t) },
        __t: t,
    };
});

const models = require('../src/models');
const { crearPedido } = require('../src/controllers/pedidoController');

const { Pedido, DetallePedido, Producto, Usuario, Sucursal, RecetaInsumo, ComboGrupo, StockSucursal, Direccion } = models;
const t = models.__t;

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearStock(cantidad) {
    const stock = { cantidad, update: jest.fn(({ cantidad: nueva }) => { stock.cantidad = nueva; }) };
    return stock;
}

const tamanio = (tamanioId, precio, factorStock) => ({ tamanioId, precio, factorStock });

// Combo "Brutal": su receta es solo el pan. Tiene dos grupos elegibles (acompañamiento y bebida),
// con papas (id 30) y cola (id 40) como opciones incluidas en el precio.
const productos = {
    20: { id: 20, nombre: 'Brutal', precio: '10000', disponible: true, categoriaId: 2,
        tamanios: [tamanio(1, 10000, 1), tamanio(2, 11000, 1), tamanio(3, 12000, 1)] },
    30: { id: 30, nombre: 'Papas', precio: '1700', disponible: true, categoriaId: 3,
        tamanios: [tamanio(1, 1700, 1), tamanio(2, 2100, 1.5), tamanio(3, 2600, 2)] },
    31: { id: 31, nombre: 'Papas con cheddar', precio: '2400', disponible: true, categoriaId: 3,
        tamanios: [tamanio(1, 2400, 1), tamanio(2, 2900, 1.5), tamanio(3, 3500, 2)] },
    40: { id: 40, nombre: 'Cola', precio: '1400', disponible: true, categoriaId: 5,
        tamanios: [tamanio(1, 1400, 1), tamanio(2, 1800, 1.4), tamanio(3, 2600, 2.8)] },
};
const recetas = {
    20: [{ insumoId: 1, cantidadBase: '1', esRemovible: false, esAgregable: false, Insumo: { nombre: 'Pan', precioComercial: null } }],
    30: [{ insumoId: 10, cantidadBase: '1', Insumo: { nombre: 'Papas' } }],
    31: [{ insumoId: 10, cantidadBase: '1', Insumo: { nombre: 'Papas' } }, { insumoId: 11, cantidadBase: '2', Insumo: { nombre: 'Cheddar' } }],
    40: [{ insumoId: 15, cantidadBase: '1', Insumo: { nombre: 'Cola' } }],
};
const gruposDelCombo = [
    { id: 1, productoId: 20, nombre: 'Acompañamiento', categoriaId: 3, productoIncluidoId: 30, obligatorio: true, orden: 1 },
    { id: 2, productoId: 20, nombre: 'Una bebida', categoriaId: 5, productoIncluidoId: 40, obligatorio: true, orden: 2 },
];

let stocks;

function pedidoCon(items) {
    return { body: { usuarioId: 1, direccionId: 3, sucursalId: 2, productos: items } };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    Usuario.findByPk.mockResolvedValue({ id: 1 });
    Sucursal.findByPk.mockResolvedValue({ id: 2 });
    Direccion.findOne.mockResolvedValue({ id: 3, usuarioId: 1 });
    Pedido.create.mockResolvedValue({ id: 100, update: jest.fn() });

    Producto.findByPk.mockImplementation((id) => Promise.resolve(productos[id] ?? null));
    RecetaInsumo.findAll.mockImplementation(({ where }) => Promise.resolve(recetas[where.productoId]));
    ComboGrupo.findAll.mockImplementation(({ where }) => Promise.resolve(where.productoId === 20 ? gruposDelCombo : []));

    stocks = { 1: crearStock(100), 10: crearStock(100), 11: crearStock(100), 15: crearStock(100) };
    StockSucursal.findOne.mockImplementation(({ where }) => Promise.resolve(stocks[where.insumoId] ?? null));
});

describe('crearPedido con tamaños', () => {
    test('un producto con tamaños cobra el precio del tamaño y descuenta stock según su factor', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{ productoId: 30, cantidad: 3, tamanioId: 3 }]), res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(DetallePedido.create).toHaveBeenCalledWith(
            expect.objectContaining({ productoId: 30, precio: 2600, tamanioId: 3 }),
            expect.anything()
        );
        expect(stocks[10].cantidad).toBe(94); // 1 porción x factor 2 x 3 unidades
    });

    test('rechaza un producto con tamaños si no se elige un tamaño válido', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{ productoId: 30, cantidad: 1, tamanioId: 9 }]), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Elegí un tamaño válido para Papas' });
        expect(t.rollback).toHaveBeenCalled();
    });
});

describe('crearPedido con combos', () => {
    test('cobra el recargo de lo elegido y descuenta el stock del producto elegido', async () => {
        const res = crearRes();

        // Combo mediano x2, con papas con cheddar (incluidas: Papas, 2100 en mediano) y la cola incluida
        await crearPedido(pedidoCon([{
            productoId: 20, cantidad: 2, tamanioId: 2,
            elecciones: [{ grupoId: 1, productoId: 31 }, { grupoId: 2, productoId: 40 }],
        }]), res);

        // 11000 + recargo de las papas (2900 - 2100 = 800) + recargo de la bebida (es la incluida: 0)
        expect(DetallePedido.create).toHaveBeenCalledWith(
            expect.objectContaining({
                precio: 11800,
                tamanioId: 2,
                combo: {
                    elecciones: [
                        { grupoId: 1, productoId: 31, recargo: 800 },
                        { grupoId: 2, productoId: 40, recargo: 0 },
                    ],
                    recargo: 800,
                },
            }),
            expect.anything()
        );
        expect(stocks[1].cantidad).toBe(98);    // pan: la receta fija no depende del tamaño
        expect(stocks[10].cantidad).toBe(97);   // papas: 1 x 1.5 x 2 unidades
        expect(stocks[11].cantidad).toBe(94);   // cheddar de las papas elegidas: 2 x 1.5 x 2
        expect(stocks[15].cantidad).toBe(97.2); // cola: 1 x 1.4 x 2 unidades = 2.8
    });

    test('exige elegir los grupos obligatorios', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{
            productoId: 20, cantidad: 1, tamanioId: 1, elecciones: [{ grupoId: 1, productoId: 30 }],
        }]), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Elegí Una bebida para Brutal' });
        expect(t.rollback).toHaveBeenCalled();
    });

    test('rechaza como acompañamiento un producto de otra categoría', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{
            productoId: 20, cantidad: 1, tamanioId: 1,
            elecciones: [{ grupoId: 1, productoId: 40 }, { grupoId: 2, productoId: 40 }],
        }]), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            mensaje: 'Cola no es una opción válida de Acompañamiento para Brutal',
        });
    });

    test('rechaza un grupo que no pertenece al combo', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{
            productoId: 20, cantidad: 1, tamanioId: 1, elecciones: [{ grupoId: 99, productoId: 30 }],
        }]), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'El grupo 99 no pertenece a Brutal' });
    });

    test('un producto que no es combo no admite elecciones', async () => {
        const res = crearRes();

        await crearPedido(pedidoCon([{
            productoId: 30, cantidad: 1, tamanioId: 1, elecciones: [{ grupoId: 1, productoId: 31 }],
        }]), res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Papas no es un combo' });
    });
});
