const { obtenerParametros } = require('../utils/parametros');

// GET /parametros → solo lo que necesita la tienda (los demás se usan del lado del servidor)
const verParametrosPublicos = async (req, res) => {
    try {
        const p = await obtenerParametros();
        return res.json({
            radioEntregaKm: p.radioEntregaKm,
            diasParaCalificar: p.diasParaCalificar,
            maxPedidosEnCurso: p.maxPedidosEnCurso,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ mensaje: 'Error al obtener los parámetros' });
    }
};

module.exports = { verParametrosPublicos };