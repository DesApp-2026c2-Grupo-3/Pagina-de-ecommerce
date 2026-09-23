const esIdValido = (req, res, next) => {
    const { id } = req.params;

    const esNumero = !isNaN(id) && Number.isInteger(Number(id)) && Number(id) > 0;

    if (!esNumero) {
        return res.status(400).json({
            mensaje: 'El parámetro ID debe ser un número entero válido'
        });
    }
    next();
};

module.exports = { esIdValido };