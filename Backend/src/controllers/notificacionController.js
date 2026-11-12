'use strict';

const notificacionRepository = require('../notifications/notificacionRepository');
const { notificacionService } = require('../notifications');
const registro = require('../notifications/registroEstrategias');

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const TIPOS_ADMIN = registro.tiposInbox('admin');

function destinatario(req) {
    return {
        destinatarioTipo: 'admin',
        destinatarioId: req.identidad.id,
    };
}

function leerLimite(valor) {
    if (valor === undefined) return LIMITE_POR_DEFECTO;

    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > LIMITE_MAXIMO) {
        return null;
    }

    return numero;
}

function errorServidor(res, error) {
    console.error('No se pudo procesar la notificación:', error.message);
    return res.status(500).json({ mensaje: 'Error del servidor' });
}

const listar = async (req, res) => {
    const limite = leerLimite(req.query.limite);

    if (limite === null) {
        return res.status(400).json({
            code: 'LIMITE_INVALIDO',
            mensaje: `El límite debe ser un entero entre 1 y ${LIMITE_MAXIMO}`,
        });
    }

    const antesDe = req.query.antesDe;

    if (antesDe !== undefined && (typeof antesDe !== 'string' || antesDe.length > 500)) {
        return res.status(400).json({
            code: 'CURSOR_INVALIDO',
            mensaje: 'El cursor no es válido',
        });
    }

    try {
        const pagina = await notificacionRepository.listarPagina({
            ...destinatario(req),
            tipos: TIPOS_ADMIN,
            limite,
            cursor: antesDe,
        });

        return res.status(200).json(pagina);
    } catch (error) {
        if (error?.code === 'CURSOR_INVALIDO') {
            return res.status(400).json({
                code: 'CURSOR_INVALIDO',
                mensaje: 'El cursor no es válido',
            });
        }

        return errorServidor(res, error);
    }
};

const contarNoLeidas = async (req, res) => {
    try {
        const cantidad = await notificacionRepository.contarNoLeidas({
            ...destinatario(req),
            tipos: TIPOS_ADMIN,
        });
        return res.status(200).json({ cantidad });
    } catch (error) {
        return errorServidor(res, error);
    }
};

const marcarLeida = async (req, res) => {
    const notificacionId = Number(req.params.id);
    const leidaEn = new Date();

    try {
        const cantidad = await notificacionRepository.marcarLeidas({
            ...destinatario(req),
            notificacionId,
            leidaEn,
        });

        if (cantidad > 0) {
            await notificacionService.emitirLeida({
                ...destinatario(req),
                notificacionId,
                leidaEn: leidaEn.toISOString(),
            });
        }

        return res.status(200).json({
            ok: true,
            notificacionId,
            leidaEn: leidaEn.toISOString(),
        });
    } catch (error) {
        return errorServidor(res, error);
    }
};

const marcarTodasLeidas = async (req, res) => {
    const leidaEn = new Date();

    try {
        const cantidad = await notificacionRepository.marcarLeidas({
            ...destinatario(req),
            leidaEn,
        });

        if (cantidad > 0) {
            await notificacionService.emitirLeida({
                ...destinatario(req),
                leidaEn: leidaEn.toISOString(),
                todas: true,
            });
        }

        return res.status(200).json({
            ok: true,
            cantidad,
            leidaEn: leidaEn.toISOString(),
        });
    } catch (error) {
        return errorServidor(res, error);
    }
};

module.exports = { listar, contarNoLeidas, marcarLeida, marcarTodasLeidas };
