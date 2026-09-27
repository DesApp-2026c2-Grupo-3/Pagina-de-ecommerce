const { Direccion } = require('../models');

function validarDireccion(d) {
    if (!d.calle?.trim() || !String(d.numero ?? '').trim()) {
        return 'La calle y la altura son obligatorias';
    }
    if (!d.localidad?.trim() || !d.provincia?.trim()) {
        return 'La localidad y la provincia son obligatorias';
    }
    const lat = Number(d.latitud);
    const lon = Number(d.longitud);
    // Rango aproximado de Argentina continental
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -55.1 || lat > -21.7 || lon < -73.6 || lon > -53.5) {
        return 'Marcá la ubicación en el mapa (debe estar dentro de Argentina)';
    }
    if (d.observaciones && d.observaciones.length > 140) {
        return 'Las observaciones no pueden superar los 140 caracteres';
    }
    return null;
}

const CAMPOS = [
    'alias', 'calle', 'numero', 'piso', 'localidad', 'provincia', 'codigoPostal',
    'entreCalles', 'observaciones', 'latitud', 'longitud',
];

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
        const datos = Object.fromEntries(CAMPOS.map((c) => [c, req.body[c] ?? null]));

        const error = validarDireccion(datos);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId } }
            );
        }

        const nuevaDireccion = await Direccion.create({
            ...datos,
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
        const datos = Object.fromEntries(
            CAMPOS.map((c) => [c, req.body[c] ?? direccion[c]])
        );

        const error = validarDireccion(datos);
        if (error) {
            return res.status(400).json({ mensaje: error });
        }

        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId: direccion.usuarioId } }
            );
        }

        await direccion.update({
            ...datos,
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

module.exports = {
    obtenerDireccionesPorUsuario,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion,
};