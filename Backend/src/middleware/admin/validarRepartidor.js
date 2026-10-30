const { repartidorSchema } = require('../../schemas/repartidor/repartidor.schema');

const validarRepartidor = (req, res, next) => {
    const { value, error } = repartidorSchema.validate(req.body);

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }

    req.body = value;
    next();
};

module.exports = { validarRepartidor };