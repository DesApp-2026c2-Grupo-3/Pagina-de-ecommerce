const { parteSchema, resolverSchema } = require('../../schemas/admin/parte.schema');

const validar = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = {
    validarParte: validar(parteSchema),
    validarResolverParte: validar(resolverSchema),
};
