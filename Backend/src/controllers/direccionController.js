const { Direccion, Usuario, sequelize } = require('../models');
// Campos que el usuario puede enviar al crear o editar una dirección
const CAMPOS = [
    'alias',
    'calle',
    'numero',
    'piso',
    'localidad',
    'provincia',
    'codigoPostal',
    'entreCalles',
    'observaciones',
    'latitud',
    'longitud',
];

// Arma un objeto solo con los CAMPOS permitidos.
// Si un campo no viene en el body, usa el valor de "base" (la dirección actual al editar).
function tomarCampos(body, base = {}) {
    return Object.fromEntries(
        CAMPOS.map((campo) => [campo, body[campo] ?? base[campo] ?? null])
    );
}
// Para comparar direcciones sin importar mayúsculas, tildes ni espacios de más
const normalizar = (valor) =>
    String(valor ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

// Es la misma dirección si coinciden calle, número, piso/depto y localidad
const mismaDireccion = (a, b) =>
    ['calle', 'numero', 'piso', 'localidad'].every((campo) => normalizar(a[campo]) === normalizar(b[campo]));

// Busca si el usuario ya tiene guardada esa dirección (sin contar la que se está editando)
async function buscarRepetida(usuarioId, datos, idActual = null) {
    const direcciones = await Direccion.findAll({ where: { usuarioId } });
    return direcciones.find((d) => d.id !== idActual && mismaDireccion(d, datos)) ?? null;
}

const mensajeRepetida = (d) =>
    `Ya tenés guardada esta dirección${d.alias ? ` como «${d.alias}»` : ''}. Elegila de tu lista o editala.`;
const obtenerDireccionesPorUsuario = async (req, res) => {
    try {
        const direcciones = await Direccion.findAll({
            where: { usuarioId: req.params.usuarioId },
            order: [['predeterminada', 'DESC'], ['id', 'ASC']],
        });

        res.status(200).json(direcciones);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const crearDireccion = async (req, res) => {
    try {
        const { predeterminada, usuarioId } = req.body;

        if (!(await Usuario.findByPk(usuarioId, { attributes: ['id'] }))) {
            return res.status(401).json({ mensaje: 'Tu sesión ya no es válida. Iniciá sesión de nuevo' });
        }
        const repetida = await buscarRepetida(usuarioId, req.body);
        if (repetida) {
            return res.status(409).json({ mensaje: mensajeRepetida(repetida) });
        }
        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId } }
            );
        }

        const nuevaDireccion = await Direccion.create({
            ...tomarCampos(req.body),
            predeterminada: !!predeterminada,
            usuarioId,
        });

        res.status(201).json(nuevaDireccion);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const actualizarDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findByPk(req.params.id);

        if (!direccion) {
            return res.status(404).json({ mensaje: 'Dirección no encontrada' });
        }

        const { predeterminada } = req.body;
        const repetida = await buscarRepetida(direccion.usuarioId, tomarCampos(req.body, direccion), direccion.id);
        if (repetida) {
            return res.status(409).json({ mensaje: mensajeRepetida(repetida) });
        }
        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId: direccion.usuarioId } }
            );
        }

        await direccion.update({
            ...tomarCampos(req.body, direccion),
            predeterminada: predeterminada ?? direccion.predeterminada,
        });

        res.status(200).json(direccion);
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};

const eliminarDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findByPk(req.params.id);

        if (!direccion) {
            return res.status(404).json({ mensaje: 'Dirección no encontrada' });
        }

        await direccion.destroy();

        res.status(200).json({ mensaje: 'Dirección eliminada correctamente' });
    } catch (error) {
        console.error('Algo salió mal', error.message);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
};
// PATCH /direcciones/:id/predeterminada → la marca como predeterminada, y desmarca las otras del usuario
const marcarPredeterminada = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const direccion = await Direccion.findByPk(req.params.id, { transaction: t });
        if (!direccion) {
            await t.rollback();
            return res.status(404).json({ mensaje: 'Dirección no encontrada' });
        }

        // Solo puede haber una predeterminada por usuario
        await Direccion.update(
            { predeterminada: false },
            { where: { usuarioId: direccion.usuarioId }, transaction: t }
        );
        await direccion.update({ predeterminada: true }, { transaction: t });

        await t.commit();
        return res.status(200).json(direccion);
    } catch (error) {
        await t.rollback();
        console.error('Algo salió mal', error.message);
        return res.status(500).json({ mensaje: 'No se pudo marcar la dirección como predeterminada' });
    }
};

module.exports = {
    obtenerDireccionesPorUsuario,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion,
    marcarPredeterminada,
};