const { verificarToken, firmarToken } = require('../utils/jwt');
const { Usuario, Admin } = require('../models');

const DURACION_CLIENTE = '7d';
const DURACION_ADMIN = '4h';

class ErrorAuth extends Error {
    constructor(codigo) {
        super(codigo);
        this.name = 'ErrorAuth';
        this.codigo = codigo;
    }
}

function firmarTokenCliente(usuario) {
    return firmarToken({ sub: usuario.id, tipo: 'usuario' }, DURACION_CLIENTE);
}

function firmarTokenAdmin(admin) {
    return firmarToken({ sub: admin.id, tipo: 'admin', rol: admin.rol }, DURACION_ADMIN);
}

async function resolverIdentidad(token) {
    let payload;

    try {
        payload = verificarToken(token);
    } catch (error) {
        throw new ErrorAuth(error?.name === 'TokenExpiredError' ? 'AUTH_EXPIRED' : 'AUTH_INVALID');
    }

    if (!payload?.sub || !payload?.tipo) {
        throw new ErrorAuth('AUTH_INVALID');
    }

    if (payload.tipo === 'usuario') {
        const usuario = await Usuario.findByPk(payload.sub, {
            attributes: ['id', 'nombre', 'sucursalId'],
        });

        if (!usuario) {
            throw new ErrorAuth('AUTH_INVALID');
        }

        return {
            tipo: 'cliente',
            id: usuario.id,
            rol: 'cliente',
            sucursalId: usuario.sucursalId ?? null,
            nombre: usuario.nombre,
        };
    }

    if (payload.tipo === 'admin') {
        const admin = await Admin.findByPk(payload.sub, {
            attributes: ['id', 'nombre', 'rol', 'sucursalId', 'activo'],
        });

        if (!admin || !admin.activo) {
            throw new ErrorAuth('AUTH_INVALID');
        }

        return {
            tipo: 'admin',
            id: admin.id,
            rol: admin.rol,
            sucursalId: admin.sucursalId ?? null,
            nombre: admin.nombre,
        };
    }

    throw new ErrorAuth('AUTH_INVALID');
}

module.exports = {
    ErrorAuth,
    firmarTokenCliente,
    firmarTokenAdmin,
    resolverIdentidad,
};
