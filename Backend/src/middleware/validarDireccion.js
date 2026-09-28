const { crearDireccionSchema, actualizarDireccionSchema } = require('../schemas/direccion.schema');

const validarCrearDireccion = (req, res, next) => {
    const { value, error } = crearDireccionSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

const validarActualizarDireccion = (req, res, next) => {
    const { value, error } = actualizarDireccionSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }
    req.body = value;
    next();
};

module.exports = { validarCrearDireccion, validarActualizarDireccion };