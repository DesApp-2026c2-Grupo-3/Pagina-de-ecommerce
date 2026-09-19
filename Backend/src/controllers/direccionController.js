const { Direccion } = require('../models');

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
        const { alias, calle, numero, piso, ciudad, codigoPostal, predeterminada, usuarioId } = req.body;

        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId } }
            );
        }

        const nuevaDireccion = await Direccion.create({
            alias,
            calle,
            numero,
            piso,
            ciudad,
            codigoPostal,
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

        const { alias, calle, numero, piso, ciudad, codigoPostal, predeterminada } = req.body;

        if (predeterminada) {
            await Direccion.update(
                { predeterminada: false },
                { where: { usuarioId: direccion.usuarioId } }
            );
        }

        await direccion.update({
            alias: alias ?? direccion.alias,
            calle: calle ?? direccion.calle,
            numero: numero ?? direccion.numero,
            piso: piso ?? direccion.piso,
            ciudad: ciudad ?? direccion.ciudad,
            codigoPostal: codigoPostal ?? direccion.codigoPostal,
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