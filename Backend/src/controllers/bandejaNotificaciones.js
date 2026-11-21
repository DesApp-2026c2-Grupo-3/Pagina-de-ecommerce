'use strict';

const notificacionRepository = require('../notifications/notificacionRepository');
const { notificacionService } = require('../notifications');
const registro = require('../notifications/registroEstrategias');

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

function leerLimite(valor) {
    if (valor === undefined) return LIMITE_POR_DEFECTO;

    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 1 || numero > LIMITE_MAXIMO) {
        return null;
    }

    return numero;
}

function cursorInvalido(res) {
    return res.status(400).json({
        code: 'CURSOR_INVALIDO',
        mensaje: 'El cursor no es válido',
    });
}

// Template Method (D-06): la misma bandeja para admin, cliente y repartidor.
// Cambian el tipo de destinatario (quién es el dueño de la fila) y la audiencia
// (qué tipos de notificación muestra). El id del destinatario siempre sale del token.
function crearControladorBandeja({ destinatarioTipo, audiencia }) {
    const tipos = registro.tiposInbox(audiencia);

    const destinatario = (req) => ({
        destinatarioTipo,
        destinatarioId: req.identidad.id,
    });

    function errorServidor(res, error) {
        console.error(`No se pudo procesar la notificación (${destinatarioTipo}):`, error.message);
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
            return cursorInvalido(res);
        }

        try {
            const pagina = await notificacionRepository.listarPagina({
                ...destinatario(req),
                tipos,
                limite,
                cursor: antesDe,
            });

            return res.status(200).json(pagina);
        } catch (error) {
            if (error?.code === 'CURSOR_INVALIDO') return cursorInvalido(res);
            return errorServidor(res, error);
        }
    };

    const contarNoLeidas = async (req, res) => {
        try {
            const cantidad = await notificacionRepository.contarNoLeidas({
                ...destinatario(req),
                tipos,
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

    return { listar, contarNoLeidas, marcarLeida, marcarTodasLeidas };
}

module.exports = { crearControladorBandeja };
