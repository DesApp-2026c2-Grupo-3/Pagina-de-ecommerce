const { Parametro } = require('../../models');
const { obtenerParametros } = require('../../utils/parametros');

// GET /admin/parametros → todos los parámetros (cualquier admin los puede ver)
const verParametros = async (req, res) => {
    try {
        return res.json(await obtenerParametros());
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener los parámetros' });
    }
};

// PUT /admin/parametros → los reemplaza todos (solo el master; los valida validarParametros)
const guardarParametros = async (req, res) => {
    try {
        await obtenerParametros(); // asegura que exista la fila
        await Parametro.update(req.body, { where: { id: 1 } });
        return res.json({ mensaje: 'Parámetros guardados', parametros: await obtenerParametros() });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al guardar los parámetros' });
    }
};

module.exports = { verParametros, guardarParametros };