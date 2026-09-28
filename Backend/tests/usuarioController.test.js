jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
    hashSync: jest.fn(() => 'hash-falso'),
}));
jest.mock('../src/models', () => ({
    Usuario: { findAll: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
    Sucursal: { findByPk: jest.fn() },
}));

const bcrypt = require('bcrypt');
const { Usuario, Sucursal } = require('../src/models');
const {
    verUsuarios,
    crearUsuario,
    login,
    obtenerUsuarioPorId,
    actualizarSucursalPredeterminada,
    actualizarUsuario,
} = require('../src/controllers/usuarioController');

function crearRes() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

function usuarioDeLaBase() {
    return {
        id: 1,
        nombre: 'Juan',
        apellido: 'Pérez',
        email: 'juan@mail.com',
        telefono: '11 1234-5678',
        dni: '30123456',
        fechaNacimiento: '1995-05-20',
        password: 'hash-viejo',
        update: jest.fn(),
    };
}

beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('verUsuarios', () => {
    test('devuelve la lista de usuarios sin las contraseñas', async () => {
        Usuario.findAll.mockResolvedValue([{ id: 1 }]);
        const res = crearRes();

        await verUsuarios({}, res);

        expect(Usuario.findAll).toHaveBeenCalledWith({ attributes: { exclude: ['password'] } });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findAll.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await verUsuarios({}, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('crearUsuario (registro)', () => {
    const body = { nombre: '  Juan ', email: ' Juan@Mail.com ', password: 'secreto123' };
    const respuestaRegistro = { mensaje: '¡Tu cuenta fue creada! Iniciá sesión para continuar.' };

    test('guarda la contraseña encriptada y el email normalizado', async () => {
        Usuario.findOne.mockResolvedValue(null);
        bcrypt.hash.mockResolvedValue('hash-seguro');
        const res = crearRes();

        await crearUsuario({ body }, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('secreto123', 10);
        expect(Usuario.create).toHaveBeenCalledWith({
            nombre: 'Juan',
            email: 'juan@mail.com',
            password: 'hash-seguro',
        });
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(respuestaRegistro);
    });

    test('si el email ya existe, responde un error genérico (sin decir que está en uso)', async () => {
        Usuario.findOne.mockResolvedValue({ id: 5 });
        bcrypt.hash.mockResolvedValue('hash-seguro');
        const res = crearRes();

        await crearUsuario({ body }, res);

        expect(Usuario.create).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'No se pudo completar el registro' });
    });

    test('encripta la contraseña aunque el email exista, para tardar lo mismo', async () => {
        Usuario.findOne.mockResolvedValue({ id: 5 });

        await crearUsuario({ body }, crearRes());

        expect(bcrypt.hash).toHaveBeenCalled();
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findOne.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await crearUsuario({ body }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('login', () => {
    const body = { email: ' JUAN@mail.com ', password: 'secreto123' };

    test('responde 401 si el email no existe', async () => {
        Usuario.findOne.mockResolvedValue(null);
        const res = crearRes();

        await login({ body }, res);

        expect(Usuario.findOne).toHaveBeenCalledWith({ where: { email: 'juan@mail.com' } });
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('responde 401 si la contraseña es incorrecta (mismo mensaje que el email)', async () => {
        Usuario.findOne.mockResolvedValue(usuarioDeLaBase());
        bcrypt.compare.mockResolvedValue(false);
        const res = crearRes();

        await login({ body }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-password-incorrectos' });
    });

    test('con datos correctos, devuelve el usuario sin la contraseña', async () => {
        Usuario.findOne.mockResolvedValue(usuarioDeLaBase());
        bcrypt.compare.mockResolvedValue(true);
        const res = crearRes();

        await login({ body }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ id: 1, nombre: 'Juan', email: 'juan@mail.com' });
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findOne.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await login({ body }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
        test('compara la contraseña aunque el email no exista, para tardar lo mismo', async () => {
        Usuario.findOne.mockResolvedValue(null);
        bcrypt.compare.mockResolvedValue(false);

        await login({ body }, crearRes());

        expect(bcrypt.compare).toHaveBeenCalledWith('secreto123', 'hash-falso');
    });

    test('ante un error no muestra detalles internos', async () => {
        Usuario.findOne.mockRejectedValue(new Error('detalle interno de la base'));
        const res = crearRes();

        await login({ body }, res);

        expect(res.json.mock.calls[0][0]).not.toHaveProperty('error');
    });
});

describe('obtenerUsuarioPorId', () => {
    test('devuelve el usuario sin pedir la contraseña a la base', async () => {
        Usuario.findByPk.mockResolvedValue({ id: 1 });
        const res = crearRes();

        await obtenerUsuarioPorId({ params: { id: '1' } }, res);

        const { attributes } = Usuario.findByPk.mock.calls[0][1];
        expect(attributes).not.toContain('password');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 404 si no existe', async () => {
        Usuario.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await obtenerUsuarioPorId({ params: { id: '99' } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await obtenerUsuarioPorId({ params: { id: '1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('actualizarSucursalPredeterminada', () => {
    test('responde 404 si el usuario no existe', async () => {
        Usuario.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarSucursalPredeterminada({ params: { id: '99' }, body: { sucursalId: 2 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('responde 404 si la sucursal no existe', async () => {
        Usuario.findByPk.mockResolvedValue(usuarioDeLaBase());
        Sucursal.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarSucursalPredeterminada({ params: { id: '1' }, body: { sucursalId: 99 } }, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ mensaje: 'Sucursal no encontrada' });
    });

    test('guarda la sucursal y devuelve el usuario actualizado', async () => {
        const usuario = usuarioDeLaBase();
        const actualizado = { id: 1, sucursalId: 2 };
        // La primera búsqueda trae el usuario; la segunda, el usuario ya actualizado
        Usuario.findByPk.mockResolvedValueOnce(usuario).mockResolvedValueOnce(actualizado);
        Sucursal.findByPk.mockResolvedValue({ id: 2 });
        const res = crearRes();

        await actualizarSucursalPredeterminada({ params: { id: '1' }, body: { sucursalId: 2 } }, res);

        expect(usuario.update).toHaveBeenCalledWith({ sucursalId: 2 });
        expect(res.json).toHaveBeenCalledWith(actualizado);
    });

    test('sin sucursal, la quita (queda en null)', async () => {
        const usuario = usuarioDeLaBase();
        Usuario.findByPk.mockResolvedValueOnce(usuario).mockResolvedValueOnce({ id: 1 });
        const res = crearRes();

        await actualizarSucursalPredeterminada({ params: { id: '1' }, body: {} }, res);

        expect(Sucursal.findByPk).not.toHaveBeenCalled();
        expect(usuario.update).toHaveBeenCalledWith({ sucursalId: null });
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await actualizarSucursalPredeterminada({ params: { id: '1' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('actualizarUsuario', () => {
    test('responde 404 si no existe', async () => {
        Usuario.findByPk.mockResolvedValue(null);
        const res = crearRes();

        await actualizarUsuario({ params: { id: '99' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('actualiza lo que llega y conserva el resto', async () => {
        const usuario = usuarioDeLaBase();
        Usuario.findByPk.mockResolvedValue(usuario);
        const res = crearRes();

        await actualizarUsuario({ params: { id: '1' }, body: { nombre: '  Juancito ' } }, res);

        const datos = usuario.update.mock.calls[0][0];
        expect(datos).toMatchObject({ nombre: 'Juancito', apellido: 'Pérez', email: 'juan@mail.com' });
        expect(datos).not.toHaveProperty('password'); // sin contraseña nueva, no se toca
        expect(res.json.mock.calls[0][0]).not.toHaveProperty('password');
    });

    test('para cambiar la contraseña exige la actual', async () => {
        Usuario.findByPk.mockResolvedValue(usuarioDeLaBase());
        const res = crearRes();

        await actualizarUsuario({ params: { id: '1' }, body: { password: 'nueva123' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ code: 'password-actual-requerida' });
    });

    test('rechaza si la contraseña actual es incorrecta', async () => {
        const usuario = usuarioDeLaBase();
        Usuario.findByPk.mockResolvedValue(usuario);
        bcrypt.compare.mockResolvedValue(false);
        const res = crearRes();

        await actualizarUsuario({
            params: { id: '1' },
            body: { password: 'nueva123', passwordActual: 'equivocada' },
        }, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('con la contraseña actual correcta, guarda la nueva encriptada', async () => {
        const usuario = usuarioDeLaBase();
        Usuario.findByPk.mockResolvedValue(usuario);
        bcrypt.compare.mockResolvedValue(true);
        bcrypt.hash.mockResolvedValue('hash-nuevo');
        const res = crearRes();

        await actualizarUsuario({
            params: { id: '1' },
            body: { password: 'nueva123', passwordActual: 'secreto123' },
        }, res);

        expect(bcrypt.compare).toHaveBeenCalledWith('secreto123', 'hash-viejo');
        expect(usuario.update).toHaveBeenCalledWith(expect.objectContaining({ password: 'hash-nuevo' }));
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('responde 500 si falla la base de datos', async () => {
        Usuario.findByPk.mockRejectedValue(new Error('Base caída'));
        const res = crearRes();

        await actualizarUsuario({ params: { id: '1' }, body: {} }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
        test('no permite usar un email de otra cuenta', async () => {
        const usuario = usuarioDeLaBase();
        Usuario.findByPk.mockResolvedValue(usuario);
        Usuario.findOne.mockResolvedValue({ id: 2 });
        const res = crearRes();

        await actualizarUsuario({ params: { id: '1' }, body: { email: 'otro@mail.com' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ code: 'email-no-disponible' });
        expect(usuario.update).not.toHaveBeenCalled();
    });

    test('si el email no cambia, no lo vuelve a verificar', async () => {
        Usuario.findByPk.mockResolvedValue(usuarioDeLaBase());

        await actualizarUsuario({ params: { id: '1' }, body: { email: 'Juan@Mail.com' } }, crearRes());

        expect(Usuario.findOne).not.toHaveBeenCalled();
    });
});