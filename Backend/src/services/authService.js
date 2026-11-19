const { verificarToken, firmarToken } = require('../utils/jwt');
const { Usuario, Admin, Repartidor } = require('../models');

const DURACION_CLIENTE = '7d';
const DURACION_ADMIN = '4h';
const DURACION_REPARTIDOR = '12h'; // un turno largo

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

function firmarTokenRepartidor(repartidor) {
    return firmarToken(
        { sub: repartidor.id, tipo: 'repartidor', rol: 'REPARTIDOR' },
        DURACION_REPARTIDOR
    );
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

    if (payload.tipo === 'repartidor') {
        // Repartidor es paranoid: findByPk no encuentra a los dados de baja
        const repartidor = await Repartidor.findByPk(payload.sub, {
            attributes: ['id', 'nombre', 'apellido', 'sucursalId', 'activo'],
        });

        if (!repartidor || !repartidor.activo) {
            throw new ErrorAuth('AUTH_INVALID');
        }

        return {
            tipo: 'repartidor',
            id: repartidor.id,
            rol: 'REPARTIDOR',
            sucursalId: repartidor.sucursalId,
            nombre: `${repartidor.nombre} ${repartidor.apellido}`,
        };
    }

    throw new ErrorAuth('AUTH_INVALID');
}

module.exports = {
    ErrorAuth,
    firmarTokenCliente,
    firmarTokenAdmin,
    firmarTokenRepartidor,
    resolverIdentidad,
};
