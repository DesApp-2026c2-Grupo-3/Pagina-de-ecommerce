'use strict';

const { crearFabricaNotificaciones } = require('../../src/notifications/fabricaNotificaciones');
const registro = require('../../src/notifications/registroEstrategias');

function crearServicio() {
    return { publicar: jest.fn(async (notificacion) => notificacion) };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

test('resuelve la estrategia y publica el contrato normalizado', async () => {
    const notificacionService = crearServicio();
    const fabrica = crearFabricaNotificaciones({ notificacionService, registro });

    const resultado = await fabrica.publicarPorTipo('sucursal.modificada_por_admin', {
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: ['horarios'],
    });

    expect(notificacionService.publicar).toHaveBeenCalledWith({
        tipo: 'sucursal.modificada_por_admin',
        version: 1,
        datos: {
            sucursalId: 2,
            sucursalNombre: 'Centro',
            adminId: 7,
            adminNombre: 'Ana',
            cambios: ['horarios'],
        },
        destinos: { roles: ['MASTER'] },
    });
    expect(resultado).not.toBeNull();
});

test('descarta un tipo no registrado sin publicar', async () => {
    const notificacionService = crearServicio();
    const fabrica = crearFabricaNotificaciones({ notificacionService, registro });

    await expect(fabrica.publicarPorTipo('tipo.inexistente', {})).resolves.toBeNull();
    expect(notificacionService.publicar).not.toHaveBeenCalled();
});

test('un payload inválido no publica y no propaga el error', async () => {
    const notificacionService = crearServicio();
    const fabrica = crearFabricaNotificaciones({ notificacionService, registro });

    await expect(fabrica.publicarPorTipo('sucursal.modificada_por_admin', {
        sucursalId: 2,
        sucursalNombre: 'Centro',
        adminId: 7,
        adminNombre: 'Ana',
        cambios: [],
    })).resolves.toBeNull();

    expect(notificacionService.publicar).not.toHaveBeenCalled();
});
