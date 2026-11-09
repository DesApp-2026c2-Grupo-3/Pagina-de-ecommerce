'use strict';

const { NotificacionService } = require('../../src/notifications/notificacionService');

const FECHA = new Date('2026-11-02T15:00:00.000Z');
const NOTIFICACION = {
    id: 1,
    tipo: 'pedido.creado',
    version: 1,
    ocurridoEn: FECHA.toISOString(),
    datos: { pedidoId: 45 },
    destinos: { administradoresSucursal: [2] },
};

function crearRepository() {
    return { guardar: jest.fn().mockResolvedValue(NOTIFICACION) };
}

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

describe('NotificacionService', () => {
    test('persiste y envía la notificación por todos los canales', async () => {
        const repository = crearRepository();
        const canal = { enviar: jest.fn().mockResolvedValue(undefined) };
        const service = new NotificacionService({ repository, canales: [canal] });

        const resultado = await service.publicar({
            tipo: 'pedido.creado',
            datos: { pedidoId: 45 },
            destinos: { administradoresSucursal: [2] },
            ocurridoEn: FECHA,
        });

        expect(repository.guardar).toHaveBeenCalledWith({
            tipo: 'pedido.creado',
            datos: { pedidoId: 45 },
            destinos: { administradoresSucursal: [2] },
            version: 1,
            ocurridoEn: FECHA,
        });
        expect(canal.enviar).toHaveBeenCalledWith(NOTIFICACION);
        expect(resultado).toEqual(NOTIFICACION);
    });

    test('no interrumpe la publicación si falla la persistencia', async () => {
        const repository = { guardar: jest.fn().mockRejectedValue(new Error('db caída')) };
        const canal = { enviar: jest.fn() };
        const service = new NotificacionService({ repository, canales: [canal] });

        const resultado = await service.publicar({
            tipo: 'pedido.creado',
            datos: {},
        });

        expect(resultado).toBeNull();
        expect(canal.enviar).not.toHaveBeenCalled();
    });

    test('agrega canales y emite la lectura al destinatario', async () => {
        const repository = crearRepository();
        const service = new NotificacionService({ repository });
        const canal = { emitirLeida: jest.fn().mockResolvedValue(undefined) };

        service.usarCanal(canal);
        await service.emitirLeida({
            destinatarioTipo: 'admin',
            destinatarioId: 3,
            notificacionId: 9,
            leidaEn: FECHA.toISOString(),
        });

        expect(canal.emitirLeida).toHaveBeenCalledWith({
            destinatarioTipo: 'admin',
            destinatarioId: 3,
            notificacionId: 9,
            leidaEn: FECHA.toISOString(),
            todas: false,
        });
    });
});
