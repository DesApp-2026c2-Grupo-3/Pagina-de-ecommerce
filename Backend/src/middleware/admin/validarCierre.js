const { cerrarSchema } = require('../../schemas/admin/cierre.schema');

const validarCierre = (req, res, next) => {
    const { value, error } = cerrarSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ code: error.details[0].message });
    }
    req.body = value;
    next();
};

module.exports = { validarCierre };
