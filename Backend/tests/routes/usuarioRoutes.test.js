// Verifica el armado de /usuario: cada request pasa por la cadena real de middlewares
// (validación de id, autenticación y control de dueño) con la identidad simulada.

jest.mock('express', () => {
    const rutas = [];
    const registrar = (metodo) => (path, ...handlers) => rutas.push({ metodo, path, handlers });
    const router = { get: registrar('GET'), post: registrar('POST'), put: registrar('PUT') };
    return { Router: () => router, __rutas: rutas };
});

jest.mock('../../src/services/authService', () => ({
    resolverIdentidad: jest.fn(),
}));

jest.mock('../../src/controllers/usuarioController', () => {
    const responder = (nombre) => jest.fn((req, res) => res.status(200).json({ controlador: nombre }));
    return {
        verUsuarios: responder('verUsuarios'),
        crearUsuario: responder('crearUsuario'),
        login: responder('login'),
        obtenerMiUsuario: responder('obtenerMiUsuario'),
        obtenerUsuarioPorId: responder('obtenerUsuarioPorId'),
        actualizarUsuario: responder('actualizarUsuario'),
        actualizarSucursalPredeterminada: responder('actualizarSucursalPredeterminada'),
        solicitarRecuperacion: responder('solicitarRecuperacion'),
        restablecerPassword: responder('restablecerPassword'),
    };
});

const { __rutas: rutas } = require('express');
const { resolverIdentidad } = require('../../src/services/authService');
const usuarioController = require('../../src/controllers/usuarioController');
require('../../src/routes/usuarioRoutes');

const CLIENTE_7 = { tipo: 'cliente', id: 7, rol: 'cliente', sucursalId: 2, nombre: 'Juan' };
const CLIENTE_8 = { tipo: 'cliente', id: 8, rol: 'cliente', sucursalId: 2, nombre: 'Ana' };
const ADMIN = { tipo: 'admin', id: 3, rol: 'ADMIN', sucursalId: 2, nombre: 'Admin' };
const MASTER = { tipo: 'admin', id: 1, rol: 'MASTER', sucursalId: null, nombre: 'Master' };
const REPARTIDOR_7 = { tipo: 'repartidor', id: 7, rol: 'REPARTIDOR', sucursalId: 2, nombre: 'Rep' };

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
}

function buscarRuta(metodo, path) {
    const ruta = rutas.find((r) => r.metodo === metodo && r.path === path);
    if (!ruta) throw new Error(`No existe la ruta ${metodo} ${path}`);
    return ruta;
}

// Ejecuta la cadena como Express: sigue mientras cada handler llame a next()
async function pedir(metodo, path, { id, identidad, body = {} } = {}) {
    const req = {
        params: id === undefined ? {} : { id: String(id) },
        headers: identidad === undefined ? {} : { authorization: 'Bearer token' },
        cookies: {},
        body,
    };
    const res = crearRes();

    if (identidad) resolverIdentidad.mockResolvedValue(identidad);

    for (const handler of buscarRuta(metodo, path).handlers) {
        let siguio = false;
        await handler(req, res, () => { siguio = true; });
        if (!siguio) break;
    }

    return { status: res.status.mock.calls.at(-1)?.[0], cuerpo: res.json.mock.calls.at(-1)?.[0] };
}

const PERFIL_VALIDO = { nombre: 'Juan', email: 'juan@mail.com' };

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe.each([
    ['GET', '/:id', 'obtenerUsuarioPorId', {}],
    ['PUT', '/:id', 'actualizarUsuario', PERFIL_VALIDO],
    ['PUT', '/:id/sucursal', 'actualizarSucursalPredeterminada', { sucursalId: 2 }],
])('%s /usuario%s', (metodo, path, controlador, body) => {
    test('el dueño accede', async () => {
        const r = await pedir(metodo, path, { id: 7, identidad: CLIENTE_7, body });

        expect(r).toEqual({ status: 200, cuerpo: { controlador } });
    });

    test.each([['un ADMIN', ADMIN], ['el MASTER', MASTER]])('%s accede a cualquier perfil', async (_, identidad) => {
        const r = await pedir(metodo, path, { id: 7, identidad, body });

        expect(r).toEqual({ status: 200, cuerpo: { controlador } });
    });

    test('otro cliente recibe 403', async () => {
        const r = await pedir(metodo, path, { id: 7, identidad: CLIENTE_8, body });

        expect(r.status).toBe(403);
        expect(usuarioController[controlador]).not.toHaveBeenCalled();
    });

    test('un repartidor recibe 403 aunque su id coincida', async () => {
        const r = await pedir(metodo, path, { id: 7, identidad: REPARTIDOR_7, body });

        expect(r.status).toBe(403);
        expect(usuarioController[controlador]).not.toHaveBeenCalled();
    });

    test('sin token responde 401', async () => {
        const r = await pedir(metodo, path, { id: 7, body });

        expect(r.status).toBe(401);
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(usuarioController[controlador]).not.toHaveBeenCalled();
    });

    test('un id inválido responde 400 antes de autenticar', async () => {
        const r = await pedir(metodo, path, { id: 'abc', identidad: CLIENTE_7, body });

        expect(r.status).toBe(400);
        expect(resolverIdentidad).not.toHaveBeenCalled();
        expect(usuarioController[controlador]).not.toHaveBeenCalled();
    });
});

describe('PUT /usuario/:id valida el body después del control de dueño', () => {
    test('otro cliente recibe 403 aunque el body sea inválido', async () => {
        const r = await pedir('PUT', '/:id', { id: 7, identidad: CLIENTE_8, body: {} });

        expect(r.status).toBe(403);
    });

    test('el dueño con un body inválido recibe 400', async () => {
        const r = await pedir('PUT', '/:id', { id: 7, identidad: CLIENTE_7, body: { email: 'no-es-email' } });

        expect(r.status).toBe(400);
        expect(usuarioController.actualizarUsuario).not.toHaveBeenCalled();
    });
});

describe('GET /usuario (listado)', () => {
    test('sin token responde 401', async () => {
        const r = await pedir('GET', '/');

        expect(r.status).toBe(401);
        expect(usuarioController.verUsuarios).not.toHaveBeenCalled();
    });

    test.each([['un cliente', CLIENTE_7], ['un repartidor', REPARTIDOR_7]])('%s recibe 403', async (_, identidad) => {
        const r = await pedir('GET', '/', { identidad });

        expect(r.status).toBe(403);
        expect(usuarioController.verUsuarios).not.toHaveBeenCalled();
    });

    test('un administrador obtiene el listado', async () => {
        const r = await pedir('GET', '/', { identidad: ADMIN });

        expect(r).toEqual({ status: 200, cuerpo: { controlador: 'verUsuarios' } });
    });
});

describe('rutas públicas y de sesión', () => {
    test.each([
        ['POST', '/'],
        ['POST', '/login'],
        ['POST', '/recuperar-password'],
        ['POST', '/restablecer-password'],
    ])('%s /usuario%s no exige sesión', (metodo, path) => {
        const { handlers } = buscarRuta(metodo, path);
        const nombres = handlers.map((h) => h.name);

        expect(nombres).not.toContain('autenticarCualquiera');
        expect(nombres).not.toContain('autenticarUsuario');
        expect(nombres).not.toContain('esAdminJwt');
    });

    test('/me se registra antes que /:id', () => {
        const indiceMe = rutas.findIndex((r) => r.metodo === 'GET' && r.path === '/me');
        const indiceId = rutas.findIndex((r) => r.metodo === 'GET' && r.path === '/:id');

        expect(indiceMe).toBeGreaterThan(-1);
        expect(indiceMe).toBeLessThan(indiceId);
    });
});
