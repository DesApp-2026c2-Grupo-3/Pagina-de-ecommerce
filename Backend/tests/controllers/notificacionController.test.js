'use strict';

jest.mock('../../src/notifications/notificacionRepository', () => ({
    listarPagina: jest.fn(),
    contarNoLeidas: jest.fn(),
    marcarLeidas: jest.fn(),
}));

jest.mock('../../src/notifications', () => ({
    notificacionService: { emitirLeida: jest.fn() },
}));

const repository = require('../../src/notifications/notificacionRepository');
const { notificacionService } = require('../../src/notifications');
const registro = require('../../src/notifications/registroEstrategias');
const controller = require('../../src/controllers/notificacionController');

const TIPOS_ADMIN = registro.tiposInbox('admin');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function crearReq({ query = {}, params = {} } = {}) {
    return {
        query,
        params,
        identidad: { tipo: 'admin', id: 3 },
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    console.error.mockRestore();
});

test('lista notificaciones con límite por defecto', async () => {
    const pagina = { items: [], siguienteCursor: null };
    repository.listarPagina.mockResolvedValue(pagina);
    const res = crearRes();

    await controller.listar(crearReq(), res);

    expect(repository.listarPagina).toHaveBeenCalledWith({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        tipos: TIPOS_ADMIN,
        limite: 20,
        cursor: undefined,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(pagina);
});

test('rechaza un límite inválido', async () => {
    const res = crearRes();

    await controller.listar(crearReq({ query: { limite: '101' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].code).toBe('LIMITE_INVALIDO');
    expect(repository.listarPagina).not.toHaveBeenCalled();
});

test('responde 400 si el repositorio rechaza el cursor', async () => {
    const error = new Error('CURSOR_INVALIDO');
    error.code = 'CURSOR_INVALIDO';
    repository.listarPagina.mockRejectedValue(error);
    const res = crearRes();

    await controller.listar(crearReq({ query: { antesDe: 'cursor' } }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
        code: 'CURSOR_INVALIDO',
        mensaje: 'El cursor no es válido',
    });
});

test('devuelve la cantidad de no leídas', async () => {
    repository.contarNoLeidas.mockResolvedValue(4);
    const res = crearRes();

    await controller.contarNoLeidas(crearReq(), res);

    expect(repository.contarNoLeidas).toHaveBeenCalledWith({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        tipos: TIPOS_ADMIN,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ cantidad: 4 });
});

test('marca una notificación como leída y sincroniza por socket', async () => {
    repository.marcarLeidas.mockResolvedValue(1);
    const res = crearRes();

    await controller.marcarLeida(crearReq({ params: { id: '9' } }), res);

    expect(repository.marcarLeidas).toHaveBeenCalledWith({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        notificacionId: 9,
        leidaEn: expect.any(Date),
    });
    expect(notificacionService.emitirLeida).toHaveBeenCalledWith({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        notificacionId: 9,
        leidaEn: expect.any(String),
    });
    expect(res.status).toHaveBeenCalledWith(200);
});

test('no emite socket si la notificación ya estaba leída', async () => {
    repository.marcarLeidas.mockResolvedValue(0);
    const res = crearRes();

    await controller.marcarLeida(crearReq({ params: { id: '9' } }), res);

    expect(notificacionService.emitirLeida).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
});

test('marca todas como leídas y emite un único evento', async () => {
    repository.marcarLeidas.mockResolvedValue(3);
    const res = crearRes();

    await controller.marcarTodasLeidas(crearReq(), res);

    expect(notificacionService.emitirLeida).toHaveBeenCalledWith({
        destinatarioTipo: 'admin',
        destinatarioId: 3,
        leidaEn: expect.any(String),
        todas: true,
    });
    expect(res.json.mock.calls[0][0]).toEqual(expect.objectContaining({
        ok: true,
        cantidad: 3,
    }));
});
