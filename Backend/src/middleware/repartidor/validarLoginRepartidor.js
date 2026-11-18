const { loginRepartidorSchema } = require('../../schemas/repartidor/repartidor.schema');

const validarLoginRepartidor = (req, res, next) => {
    const { value, error } = loginRepartidorSchema.validate(req.body ?? {});

    if (error) {
        return res.status(400).json({
            code: error.details[0].message
        });
    }

    req.body = value;
    next();
};

module.exports = { validarLoginRepartidor };
