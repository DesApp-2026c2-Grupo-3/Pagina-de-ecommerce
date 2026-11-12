const { parametrosSchema } = require('../../schemas/admin/parametros.schema');

const validarParametros = (req, res, next) => {
    const { value, error } = parametrosSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = { validarParametros };