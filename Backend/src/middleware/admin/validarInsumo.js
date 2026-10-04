const { insumoSchema } = require('../../schemas/admin/insumo.schema');

const validarInsumo = (req, res, next) => {
    const { value, error } = insumoSchema.validate(req.body);

    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = { validarInsumo };